export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      client_configs: {
        Row: {
          client_id: string
          competitors: string[] | null
          created_at: string
          google_analytics_property_id: string | null
          hubspot_portal_id: string | null
          id: string
          industry: string | null
          linkedin_organization_id: string | null
          market_news_keywords: string[] | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          client_id: string
          competitors?: string[] | null
          created_at?: string
          google_analytics_property_id?: string | null
          hubspot_portal_id?: string | null
          id?: string
          industry?: string | null
          linkedin_organization_id?: string | null
          market_news_keywords?: string[] | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          client_id?: string
          competitors?: string[] | null
          created_at?: string
          google_analytics_property_id?: string | null
          hubspot_portal_id?: string | null
          id?: string
          industry?: string | null
          linkedin_organization_id?: string | null
          market_news_keywords?: string[] | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_configs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_metrics: {
        Row: {
          avg_time_on_page: number | null
          avg_watch_duration: number | null
          bounce_rate: number | null
          click_rate: number | null
          comments: number | null
          content_id: string
          engagement_rate: number | null
          id: string
          impressions: number | null
          likes: number | null
          measured_at: string | null
          open_rate: number | null
          retention_rate: number | null
          sends: number | null
          shares: number | null
          top_traffic_source: string | null
          unsubscribes: number | null
          views: number | null
        }
        Insert: {
          avg_time_on_page?: number | null
          avg_watch_duration?: number | null
          bounce_rate?: number | null
          click_rate?: number | null
          comments?: number | null
          content_id: string
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          measured_at?: string | null
          open_rate?: number | null
          retention_rate?: number | null
          sends?: number | null
          shares?: number | null
          top_traffic_source?: string | null
          unsubscribes?: number | null
          views?: number | null
        }
        Update: {
          avg_time_on_page?: number | null
          avg_watch_duration?: number | null
          bounce_rate?: number | null
          click_rate?: number | null
          comments?: number | null
          content_id?: string
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          measured_at?: string | null
          open_rate?: number | null
          retention_rate?: number | null
          sends?: number | null
          shares?: number | null
          top_traffic_source?: string | null
          unsubscribes?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_metrics_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      content_recommendations: {
        Row: {
          brief: Json | null
          channel: string
          client_id: string
          context_tags: string[] | null
          converted_at: string | null
          created_at: string | null
          dismissed_at: string | null
          generated_at: string | null
          id: string
          priority_score: number
          rationale: string
          score_breakdown: Json | null
          status: string | null
          supporting_metrics: Json | null
          title: string
        }
        Insert: {
          brief?: Json | null
          channel: string
          client_id: string
          context_tags?: string[] | null
          converted_at?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          generated_at?: string | null
          id?: string
          priority_score: number
          rationale: string
          score_breakdown?: Json | null
          status?: string | null
          supporting_metrics?: Json | null
          title: string
        }
        Update: {
          brief?: Json | null
          channel?: string
          client_id?: string
          context_tags?: string[] | null
          converted_at?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          generated_at?: string | null
          id?: string
          priority_score?: number
          rationale?: string
          score_breakdown?: Json | null
          status?: string | null
          supporting_metrics?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_recommendations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          body: string | null
          channel: string
          client_id: string
          created_at: string | null
          id: string
          published_at: string
          source_url: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          channel: string
          client_id: string
          created_at?: string | null
          id?: string
          published_at: string
          source_url?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          channel?: string
          client_id?: string
          created_at?: string | null
          id?: string
          published_at?: string
          source_url?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      news_cache: {
        Row: {
          articles: Json
          cache_key: string
          created_at: string
          expires_at: string
          id: string
        }
        Insert: {
          articles: Json
          cache_key: string
          created_at?: string
          expires_at: string
          id?: string
        }
        Update: {
          articles?: Json
          cache_key?: string
          created_at?: string
          expires_at?: string
          id?: string
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
