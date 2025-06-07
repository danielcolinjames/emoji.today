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
      daily_summaries: {
        Row: {
          id: string
          vote_date: string
          winning_emoji: string
          winning_count: number
          total_votes: number
          unique_emojis: number
          top_5_emojis: Json | null
          finalized_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          vote_date: string
          winning_emoji: string
          winning_count: number
          total_votes: number
          unique_emojis: number
          top_5_emojis?: Json | null
          finalized_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          vote_date?: string
          winning_emoji?: string
          winning_count?: number
          total_votes?: number
          unique_emojis?: number
          top_5_emojis?: Json | null
          finalized_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      emoji_assets: {
        Row: {
          category: string | null
          codepoint: string
          created_at: string | null
          emoji_char: string
          id: number
          image_url: string | null
          keywords: string[] | null
          name: string | null
          storage_path: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          codepoint: string
          created_at?: string | null
          emoji_char: string
          id?: number
          image_url?: string | null
          keywords?: string[] | null
          name?: string | null
          storage_path?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          codepoint?: string
          created_at?: string | null
          emoji_char?: string
          id?: number
          image_url?: string | null
          keywords?: string[] | null
          name?: string | null
          storage_path?: string | null
          updated_at?: string | null
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
      race_commentary_posts: {
        Row: {
          commentary: string
          created_at: string | null
          id: string
          post_date: string
          posted_to_farcaster: boolean | null
          updated_at: string | null
        }
        Insert: {
          commentary: string
          created_at?: string | null
          id?: string
          post_date: string
          posted_to_farcaster?: boolean | null
          updated_at?: string | null
        }
        Update: {
          commentary?: string
          created_at?: string | null
          id?: string
          post_date?: string
          posted_to_farcaster?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      race_commentary_snapshots: {
        Row: {
          id: number
          vote_date: string
          milestone: string
          timestamp_utc: string
          total_votes: number
          emoji_standings: Json
          momentum_data: Json
          historical_context: Json
          commentary_text: string | null
          chyron_text: string | null
          posted_to_farcaster: boolean | null
          farcaster_cast_hash: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          vote_date: string
          milestone: string
          timestamp_utc: string
          total_votes: number
          emoji_standings: Json
          momentum_data: Json
          historical_context: Json
          commentary_text?: string | null
          chyron_text?: string | null
          posted_to_farcaster?: boolean | null
          farcaster_cast_hash?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          vote_date?: string
          milestone?: string
          timestamp_utc?: string
          total_votes?: number
          emoji_standings?: Json
          momentum_data?: Json
          historical_context?: Json
          commentary_text?: string | null
          chyron_text?: string | null
          posted_to_farcaster?: boolean | null
          farcaster_cast_hash?: string | null
          created_at?: string | null
          updated_at?: string | null
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
      vote_nfts: {
        Row: {
          created_at: string
          id: string
          mint_price_usdc: number
          minted_at: string | null
          signature: string
          signature_payload: Json
          transaction_hash: string | null
          updated_at: string
          vote_id: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          mint_price_usdc: number
          minted_at?: string | null
          signature: string
          signature_payload: Json
          transaction_hash?: string | null
          updated_at?: string
          vote_id: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          mint_price_usdc?: number
          minted_at?: string | null
          signature?: string
          signature_payload?: Json
          transaction_hash?: string | null
          updated_at?: string
          vote_id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_nfts_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          }
        ]
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

let _supabase: ReturnType<typeof createClient<Database>> | null = null

export const supabase = new Proxy(
  {} as ReturnType<typeof createClient<Database>>,
  {
    get(target, prop) {
      if (!_supabase) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error("Supabase environment variables are not configured")
        }

        _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
      }

      return _supabase[prop as keyof typeof _supabase]
    },
  }
)
