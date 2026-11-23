import { ImageResponse } from "next/og"

/**
 * One shared brand mark for favicon, iOS home screen and Android PWA.
 * The artwork mirrors the B. monogram in the main app header.
 */
export function makeStrefaBIcon(size: number) {
  return new ImageResponse(
    <div style={{
      width: "100%", height: "100%", display: "flex",
      alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
      background: "linear-gradient(145deg, #17243b 0%, #1b3046 64%, #244c50 100%)",
    }}>
      <div style={{
        display: "flex", position: "absolute",
        width: size * .76, height: size * .76,
        left: size * .12, top: size * .12,
        borderRadius: size * .25,
        border: `${Math.max(2,Math.round(size*.007))}px solid rgba(211,250,142,0.2)`,
        transform: "rotate(-8deg)",
      }}/>
      <div style={{
        display: "flex", position: "absolute",
        width: size * .56, height: size * .56,
        left: size * .22, top: size * .22,
        borderRadius: size * .19,
        background: "rgba(211,250,142,.045)",
        transform: "rotate(8deg)",
      }}/>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#d3fa8e", fontSize: Math.round(size * .49),
        fontWeight: 900, lineHeight: 1, letterSpacing: -size * .023,
        paddingRight: Math.round(size * .02), paddingBottom: Math.round(size * .022),
      }}>B.</div>
    </div>,
    { width: size, height: size },
  )
}
