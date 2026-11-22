import { NextRequest, NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import sharp from "sharp"
import { getLoggedInSession } from "../../../../lib/auth"
import { supabase } from "../../../../lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i

// Cache only compressed image bytes, never the original multi-megabyte base64 value.
// The route still verifies the class session before accessing the cached bytes.
const optimizedLegacyImage = unstable_cache(
  async (id: string, size: "thumb" | "large"): Promise<string> => {
    const { data, error } = await supabase
      .from("gallery_items")
      .select("image,deleted")
      .eq("id", id)
      .eq("deleted", false)
      .maybeSingle()
    if (error) throw new Error("Nie udało się pobrać zdjęcia")
    if (!data || typeof data.image !== "string") throw new Error("Nie znaleziono zdjęcia")
    const match = /^data:image\/(?:jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(data.image)
    if (!match || match[1].length > 15_000_000) throw new Error("Nieprawidłowy format zdjęcia")

    const source = Buffer.from(match[1], "base64")
    const optimized = await sharp(source, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({
        width: size === "thumb" ? 540 : 1800,
        withoutEnlargement: true,
      })
      .webp({ quality: size === "thumb" ? 72 : 81, effort: 4 })
      .toBuffer()

    if (optimized.length > 2_000_000) throw new Error("Nie udało się zmniejszyć zdjęcia")
    return optimized.toString("base64")
  },
  ["strefa-b-gallery-legacy-optimized-v1"],
  { revalidate: 604800 },
)

export async function GET(request: NextRequest) {
  const session = await getLoggedInSession()
  if (!session || session.mode !== "full") {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 401 })
  }
  const id = request.nextUrl.searchParams.get("id")
  const size = request.nextUrl.searchParams.get("size")
  if (!id || !uuid.test(id) || (size !== "thumb" && size !== "large")) {
    return NextResponse.json({ error: "Nieprawidłowe żądanie" }, { status: 400 })
  }
  try {
    // Fast metadata-only check prevents serving a deleted photo from the image cache.
    const { data: visible, error: lookupError } = await supabase
      .from("gallery_feed")
      .select("id")
      .eq("id", id)
      .maybeSingle()
    if (lookupError) throw lookupError
    if (!visible) {
      return NextResponse.json({ error: "Nie znaleziono zdjęcia." }, { status: 404 })
    }
    const base64 = await optimizedLegacyImage(id, size)
    const bytes = Buffer.from(base64, "base64")
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "Vary": "Cookie",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Nie udało się wczytać zdjęcia." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}
