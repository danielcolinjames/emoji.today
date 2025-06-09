import { createClient } from "@supabase/supabase-js"
import type { Database } from "./supabase"

let _serviceClient: ReturnType<typeof createClient<Database>> | null = null

export function supabaseService() {
  if (!_serviceClient) {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      throw new Error("Supabase env vars missing (service client)")
    }
    _serviceClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    )
  }
  return _serviceClient
}
