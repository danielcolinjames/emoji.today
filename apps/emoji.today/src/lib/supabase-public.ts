import { createClient } from "@supabase/supabase-js"
import type { Database } from "./supabase"

let _publicClient: ReturnType<typeof createClient<Database>> | null = null

export function supabasePublic() {
  if (!_publicClient) {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error("Supabase env vars missing (public client)")
    }
    _publicClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return _publicClient
}
