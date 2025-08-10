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
      chyrons: {
        Row: {
          created_at: string
          id: number
          text: string
          updated_at: string
          vote_date: string
        }
        Insert: {
          created_at?: string
          id?: number
          text: string
          updated_at?: string
          vote_date?: string
        }
        Update: {
          created_at?: string
          id?: number
          text?: string
          updated_at?: string
          vote_date?: string
        }
        Relationships: []
      }
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
          created_at: string | null
          finalized_at: string | null
          id: string
          top_5_emojis: Json | null
          total_votes: number | null
          unique_emojis: number | null
          vote_date: string
          winning_count: number | null
          winning_emoji: string | null
        }
        Insert: {
          created_at?: string | null
          finalized_at?: string | null
          id?: string
          top_5_emojis?: Json | null
          total_votes?: number | null
          unique_emojis?: number | null
          vote_date: string
          winning_count?: number | null
          winning_emoji?: string | null
        }
        Update: {
          created_at?: string | null
          finalized_at?: string | null
          id?: string
          top_5_emojis?: Json | null
          total_votes?: number | null
          unique_emojis?: number | null
          vote_date?: string
          winning_count?: number | null
          winning_emoji?: string | null
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
      emoji_ranks: {
        Row: {
          accent_color: string | null
          created_at: string | null
          emoji: string
          id: string
          percentage: number | null
          rank: number | null
          updated_at: string | null
          vote_count: number
          vote_date: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string | null
          emoji: string
          id?: string
          percentage?: number | null
          rank?: number | null
          updated_at?: string | null
          vote_count?: number
          vote_date: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string | null
          emoji?: string
          id?: string
          percentage?: number | null
          rank?: number | null
          updated_at?: string | null
          vote_count?: number
          vote_date?: string
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
      leaderboards: {
        Row: {
          category: string
          created_at: string
          display_name: string | null
          fid: number
          id: string
          last_updated: string
          pfp_url: string | null
          rank: number
          secondary_value: number | null
          username: string | null
          value: number
        }
        Insert: {
          category: string
          created_at?: string
          display_name?: string | null
          fid: number
          id?: string
          last_updated?: string
          pfp_url?: string | null
          rank: number
          secondary_value?: number | null
          username?: string | null
          value: number
        }
        Update: {
          category?: string
          created_at?: string
          display_name?: string | null
          fid?: number
          id?: string
          last_updated?: string
          pfp_url?: string | null
          rank?: number
          secondary_value?: number | null
          username?: string | null
          value?: number
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
          chyron_text: string | null
          commentary_text: string | null
          created_at: string | null
          emoji_standings: Json
          farcaster_cast_hash: string | null
          historical_context: Json | null
          id: number
          milestone: string
          momentum_data: Json | null
          posted_to_farcaster: boolean | null
          timestamp_utc: string
          total_votes: number
          updated_at: string | null
          vote_date: string
        }
        Insert: {
          chyron_text?: string | null
          commentary_text?: string | null
          created_at?: string | null
          emoji_standings?: Json
          farcaster_cast_hash?: string | null
          historical_context?: Json | null
          id?: number
          milestone: string
          momentum_data?: Json | null
          posted_to_farcaster?: boolean | null
          timestamp_utc?: string
          total_votes?: number
          updated_at?: string | null
          vote_date: string
        }
        Update: {
          chyron_text?: string | null
          commentary_text?: string | null
          created_at?: string | null
          emoji_standings?: Json
          farcaster_cast_hash?: string | null
          historical_context?: Json | null
          id?: number
          milestone?: string
          momentum_data?: Json | null
          posted_to_farcaster?: boolean | null
          timestamp_utc?: string
          total_votes?: number
          updated_at?: string | null
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
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          fid: number
          id?: string
          last_updated?: string | null
          previous_usernames?: string[] | null
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          fid?: number
          id?: string
          last_updated?: string | null
          previous_usernames?: string[] | null
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
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
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          emoji: string
          fid?: number
          id?: string
          user_id: string
          vote_date: string
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          emoji?: string
          fid?: number
          id?: string
          user_id?: string
          vote_date?: string
          wallet_address?: string | null
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
      update_vote_rankings: {
        Args: { target_date: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
