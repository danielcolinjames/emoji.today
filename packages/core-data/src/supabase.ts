import { createClient } from "@supabase/supabase-js"

// NOTE: We don't pull in the full generated Database types yet to keep the
// shared package lightweight during the initial migration. Replace `any` with
// the real Database type once we move the generated types into this package.

let _supabase: ReturnType<typeof createClient<any>> | null = null

export const supabase = new Proxy({} as ReturnType<typeof createClient<any>>, {
  get(_target, prop) {
    if (!_supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase environment variables are not configured")
      }
      _supabase = createClient<any>(supabaseUrl, supabaseAnonKey)
    }
    // @ts-ignore – dynamic proxy access
    return _supabase[prop]
  },
})
