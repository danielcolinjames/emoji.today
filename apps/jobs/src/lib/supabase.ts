import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"

// Load environment variables
// When running from workspace, cwd is the jobs directory
config()

const supabaseUrl =
  process.env.SUPABASE_URL || "https://lgkbapfskatvfrsnxcys.supabase.co"
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Environment variables:", {
    SUPABASE_URL: supabaseUrl ? "Set" : "Missing",
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? "Set" : "Missing",
    cwd: process.cwd(),
  })
  throw new Error("Missing Supabase environment variables")
}

// Create Supabase client with service key for admin access
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Export types based on the database schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          fid: string
          username: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          fid: string
          username: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          fid?: string
          username?: string
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          emoji: string
          vote_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          emoji: string
          vote_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          emoji?: string
          vote_date?: string
          created_at?: string
        }
      }
      daily_results: {
        Row: {
          id: string
          vote_date: string
          emoji_votes: Record<string, number>
          winning_emoji: string | null
          total_votes: number
          finalized_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vote_date: string
          emoji_votes: Record<string, number>
          winning_emoji?: string | null
          total_votes: number
          finalized_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          vote_date?: string
          emoji_votes?: Record<string, number>
          winning_emoji?: string | null
          total_votes?: number
          finalized_at?: string | null
          created_at?: string
        }
      }
    }
  }
}
