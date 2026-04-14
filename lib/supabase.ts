import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://uwzifhwzvaeznopfgmae.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3emlmaHd6dmFlem5vcGZnbWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjI5MjEsImV4cCI6MjA5MDYzODkyMX0.i22nRuLVGRzJJYdVqnLXflmvqqAfKY7Nej0Iu8IjhJQ"

export const supabase = createClient(supabaseUrl, supabaseKey)