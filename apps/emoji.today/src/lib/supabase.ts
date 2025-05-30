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
          accent_color: string | null
          added_in: string
          category: string
          created_at: string
          emoji: string
          filename: string
          has_img_apple: boolean | null
          has_img_facebook: boolean | null
          has_img_google: boolean | null
          has_img_twitter: boolean | null
          id: string
          is_votable: boolean | null
          keywords: string[]
          name: string
          non_qualified: string | null
          search_text: string | null
          short_name: string
          short_names: string[]
          skin_variations: Json | null
          sort_order: number
          subcategory: string | null
          unicode_version: string
          unified: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          added_in: string
          category: string
          created_at?: string
          emoji: string
          filename: string
          has_img_apple?: boolean | null
          has_img_facebook?: boolean | null
          has_img_google?: boolean | null
          has_img_twitter?: boolean | null
          id?: string
          is_votable?: boolean | null
          keywords?: string[]
          name: string
          non_qualified?: string | null
          search_text?: string | null
          short_name: string
          short_names?: string[]
          skin_variations?: Json | null
          sort_order: number
          subcategory?: string | null
          unicode_version: string
          unified: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          added_in?: string
          category?: string
          created_at?: string
          emoji?: string
          filename?: string
          has_img_apple?: boolean | null
          has_img_facebook?: boolean | null
          has_img_google?: boolean | null
          has_img_twitter?: boolean | null
          id?: string
          is_votable?: boolean | null
          keywords?: string[]
          name?: string
          non_qualified?: string | null
          search_text?: string | null
          short_name?: string
          short_names?: string[]
          skin_variations?: Json | null
          sort_order?: number
          subcategory?: string | null
          unicode_version?: string
          unified?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_results: {
        Row: {
          created_at: string | null
          emoji_counts: Json
          id: string
          last_updated_at: string | null
          total_votes: number
          vote_date: string
        }
        Insert: {
          created_at?: string | null
          emoji_counts?: Json
          id?: string
          last_updated_at?: string | null
          total_votes?: number
          vote_date: string
        }
        Update: {
          created_at?: string | null
          emoji_counts?: Json
          id?: string
          last_updated_at?: string | null
          total_votes?: number
          vote_date?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          fid: number
          id: string
          last_updated: string | null
          previous_usernames: string[] | null
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          fid: number
          id?: string
          last_updated?: string | null
          previous_usernames?: string[] | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          fid?: number
          id?: string
          last_updated?: string | null
          previous_usernames?: string[] | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          emoji: string
          fid: number
          id: string
          user_id: string
          vote_date: string
        }
        Insert: {
          created_at?: string
          emoji: string
          fid: number
          id?: string
          user_id: string
          vote_date: string
        }
        Update: {
          created_at?: string
          emoji?: string
          fid?: number
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
