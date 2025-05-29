import { createClient } from "@supabase/supabase-js"

// Generated types from Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      daily_results: {
        Row: {
          created_at: string
          emoji_votes: Json | null
          finalized_at: string | null
          id: string
          total_votes: number | null
          vote_date: string
          winning_emoji: string | null
        }
        Insert: {
          created_at?: string
          emoji_votes?: Json | null
          finalized_at?: string | null
          id?: string
          total_votes?: number | null
          vote_date: string
          winning_emoji?: string | null
        }
        Update: {
          created_at?: string
          emoji_votes?: Json | null
          finalized_at?: string | null
          id?: string
          total_votes?: number | null
          vote_date?: string
          winning_emoji?: string | null
        }
        Relationships: []
      }
      emojis: {
        Row: {
          id: string
          emoji: string
          unified: string
          non_qualified: string | null
          name: string
          short_name: string
          short_names: string[]
          keywords: string[]
          category: string
          subcategory: string | null
          sort_order: number
          added_in: string
          unicode_version: string
          accent_color: string | null
          skin_variations: Json | null
          filename: string
          has_img_apple: boolean | null
          has_img_google: boolean | null
          has_img_twitter: boolean | null
          has_img_facebook: boolean | null
          search_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          emoji: string
          unified: string
          non_qualified?: string | null
          name: string
          short_name: string
          short_names?: string[]
          keywords?: string[]
          category: string
          subcategory?: string | null
          sort_order: number
          added_in: string
          unicode_version: string
          accent_color?: string | null
          skin_variations?: Json | null
          filename: string
          has_img_apple?: boolean | null
          has_img_google?: boolean | null
          has_img_twitter?: boolean | null
          has_img_facebook?: boolean | null
          search_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          emoji?: string
          unified?: string
          non_qualified?: string | null
          name?: string
          short_name?: string
          short_names?: string[]
          keywords?: string[]
          category?: string
          subcategory?: string | null
          sort_order?: number
          added_in?: string
          unicode_version?: string
          accent_color?: string | null
          skin_variations?: Json | null
          filename?: string
          has_img_apple?: boolean | null
          has_img_google?: boolean | null
          has_img_twitter?: boolean | null
          has_img_facebook?: boolean | null
          search_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          fid: number
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          fid: number
          id?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          fid?: number
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          emoji: string
          id: string
          user_id: string
          vote_date: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          user_id: string
          vote_date: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
          vote_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
