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
      airtable_records: {
        Row: {
          created_time: string | null
          fields: Json
          last_synced_at: string
          raw: Json
          record_id: string
          table_id: string
        }
        Insert: {
          created_time?: string | null
          fields?: Json
          last_synced_at?: string
          raw?: Json
          record_id: string
          table_id: string
        }
        Update: {
          created_time?: string | null
          fields?: Json
          last_synced_at?: string
          raw?: Json
          record_id?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "airtable_records_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "airtable_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      airtable_tables: {
        Row: {
          id: string
          last_synced_at: string | null
          name: string
          primary_field_name: string | null
          raw: Json
          record_count: number
        }
        Insert: {
          id: string
          last_synced_at?: string | null
          name: string
          primary_field_name?: string | null
          raw?: Json
          record_count?: number
        }
        Update: {
          id?: string
          last_synced_at?: string | null
          name?: string
          primary_field_name?: string | null
          raw?: Json
          record_count?: number
        }
        Relationships: []
      }
      asset_library: {
        Row: {
          client_id: string
          created_at: string
          id: string
          name: string
          tags: Json
          type: string
          updated_at: string
          url: string | null
          version: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          name: string
          tags?: Json
          type?: string
          updated_at?: string
          url?: string | null
          version?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          name?: string
          tags?: Json
          type?: string
          updated_at?: string
          url?: string | null
          version?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          client_id: string
          content: string
          created_at: string
          id: string
          metadata: Json
          role: string
          updated_at: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          id?: string
          metadata?: Json
          role: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_brand_guidelines: {
        Row: {
          client_id: string
          colors: Json | null
          created_at: string | null
          figma_urls: Json | null
          id: string
          style_visuel: Json | null
          typographies: Json | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          colors?: Json | null
          created_at?: string | null
          figma_urls?: Json | null
          id?: string
          style_visuel?: Json | null
          typographies?: Json | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          colors?: Json | null
          created_at?: string | null
          figma_urls?: Json | null
          id?: string
          style_visuel?: Json | null
          typographies?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_brand_guidelines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_brand_guidelines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_brand_guidelines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_brand_guidelines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_brand_guidelines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_brand_guidelines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_brand_kits: {
        Row: {
          client_id: string
          created_at: string
          figma_file_key: string
          figma_node_id: string | null
          id: string
          imported_at: string
          payload: Json
          preview_url: string | null
          source: string
          token_name: string
          token_type: string
          token_value: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          figma_file_key: string
          figma_node_id?: string | null
          id?: string
          imported_at?: string
          payload?: Json
          preview_url?: string | null
          source?: string
          token_name: string
          token_type: string
          token_value?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          figma_file_key?: string
          figma_node_id?: string | null
          id?: string
          imported_at?: string
          payload?: Json
          preview_url?: string | null
          source?: string
          token_name?: string
          token_type?: string
          token_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_configs: {
        Row: {
          client_id: string
          competitors: string[] | null
          created_at: string
          ga4_property_id: string | null
          google_ads_id: string | null
          google_analytics_property_id: string | null
          gsc_site_id: string | null
          hubspot_analytics_id: string | null
          hubspot_portal_id: string | null
          id: string
          industry: string | null
          linkedin_organization_id: string | null
          market_news_keywords: string[] | null
          meteoria_project_id: string | null
          notion_page_id: string | null
          onedrive_claude_path: string | null
          semrush_campaign_id: string | null
          semrush_project_id: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          client_id: string
          competitors?: string[] | null
          created_at?: string
          ga4_property_id?: string | null
          google_ads_id?: string | null
          google_analytics_property_id?: string | null
          gsc_site_id?: string | null
          hubspot_analytics_id?: string | null
          hubspot_portal_id?: string | null
          id?: string
          industry?: string | null
          linkedin_organization_id?: string | null
          market_news_keywords?: string[] | null
          meteoria_project_id?: string | null
          notion_page_id?: string | null
          onedrive_claude_path?: string | null
          semrush_campaign_id?: string | null
          semrush_project_id?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          client_id?: string
          competitors?: string[] | null
          created_at?: string
          ga4_property_id?: string | null
          google_ads_id?: string | null
          google_analytics_property_id?: string | null
          gsc_site_id?: string | null
          hubspot_analytics_id?: string | null
          hubspot_portal_id?: string | null
          id?: string
          industry?: string | null
          linkedin_organization_id?: string | null
          market_news_keywords?: string[] | null
          meteoria_project_id?: string | null
          notion_page_id?: string | null
          onedrive_claude_path?: string | null
          semrush_campaign_id?: string | null
          semrush_project_id?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      client_data_mappings: {
        Row: {
          alias_external_ids: Json
          client_id: string
          connector: string
          created_at: string
          external_account_id: string | null
          external_account_name: string | null
          external_project_id: string | null
          external_workspace_id: string | null
          id: string
          is_active: boolean
          is_manual_override: boolean
          last_sync_at: string | null
          mapping_strategy: string
          notes: string | null
          priority: number
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          alias_external_ids?: Json
          client_id: string
          connector: string
          created_at?: string
          external_account_id?: string | null
          external_account_name?: string | null
          external_project_id?: string | null
          external_workspace_id?: string | null
          id?: string
          is_active?: boolean
          is_manual_override?: boolean
          last_sync_at?: string | null
          mapping_strategy?: string
          notes?: string | null
          priority?: number
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          alias_external_ids?: Json
          client_id?: string
          connector?: string
          created_at?: string
          external_account_id?: string | null
          external_account_name?: string | null
          external_project_id?: string | null
          external_workspace_id?: string | null
          id?: string
          is_active?: boolean
          is_manual_override?: boolean
          last_sync_at?: string | null
          mapping_strategy?: string
          notes?: string | null
          priority?: number
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_figma_folders: {
        Row: {
          client_id: string
          created_at: string
          file_key: string
          file_name: string
          folder_id: string
          folder_name: string
          folder_type: string
          id: string
          last_synced_at: string
          page_index: number | null
          payload: Json
          project_name: string | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          file_key: string
          file_name: string
          folder_id: string
          folder_name: string
          folder_type?: string
          id?: string
          last_synced_at?: string
          page_index?: number | null
          payload?: Json
          project_name?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          file_key?: string
          file_name?: string
          folder_id?: string
          folder_name?: string
          folder_type?: string
          id?: string
          last_synced_at?: string
          page_index?: number | null
          payload?: Json
          project_name?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_figma_sync_state: {
        Row: {
          client_id: string
          created_at: string
          file_count: number
          folder_count: number
          id: string
          last_synced_at: string | null
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          file_count?: number
          folder_count?: number
          id?: string
          last_synced_at?: string | null
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          file_count?: number
          folder_count?: number
          id?: string
          last_synced_at?: string | null
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_profiles: {
        Row: {
          audience_cible: Json | null
          client_id: string
          concurrents: Json | null
          created_at: string | null
          diagnostic_pmf: Json | null
          hashtags: Json | null
          id: string
          messages_cles: Json | null
          notes: string | null
          piliers_contenu: Json | null
          presentation: string | null
          problemes_clients: Json | null
          regles_specifiques: Json | null
          ton: string | null
          types_posts: Json | null
          updated_at: string | null
        }
        Insert: {
          audience_cible?: Json | null
          client_id: string
          concurrents?: Json | null
          created_at?: string | null
          diagnostic_pmf?: Json | null
          hashtags?: Json | null
          id?: string
          messages_cles?: Json | null
          notes?: string | null
          piliers_contenu?: Json | null
          presentation?: string | null
          problemes_clients?: Json | null
          regles_specifiques?: Json | null
          ton?: string | null
          types_posts?: Json | null
          updated_at?: string | null
        }
        Update: {
          audience_cible?: Json | null
          client_id?: string
          concurrents?: Json | null
          created_at?: string | null
          diagnostic_pmf?: Json | null
          hashtags?: Json | null
          id?: string
          messages_cles?: Json | null
          notes?: string | null
          piliers_contenu?: Json | null
          presentation?: string | null
          problemes_clients?: Json | null
          regles_specifiques?: Json | null
          ton?: string | null
          types_posts?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_supermetrics_accounts: {
        Row: {
          account_id: string | null
          account_name: string | null
          client_id: string
          created_at: string
          id: number
          notes: string | null
          provider: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          client_id: string
          created_at?: string
          id?: number
          notes?: string | null
          provider?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          client_id?: string
          created_at?: string
          id?: number
          notes?: string | null
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_supermetrics_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_supermetrics_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_supermetrics_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_supermetrics_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_supermetrics_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_supermetrics_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_supermetrics_connector_links: {
        Row: {
          account_ref_id: number | null
          client_id: string
          connector: string
          created_at: string
          id: number
          notes: string | null
          updated_at: string
        }
        Insert: {
          account_ref_id?: number | null
          client_id: string
          connector: string
          created_at?: string
          id?: number
          notes?: string | null
          updated_at?: string
        }
        Update: {
          account_ref_id?: number | null
          client_id?: string
          connector?: string
          created_at?: string
          id?: number
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_supermetrics_connector_links_account_ref_id_fkey"
            columns: ["account_ref_id"]
            isOneToOne: false
            referencedRelation: "supermetrics_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_supermetrics_connector_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_supermetrics_connector_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_supermetrics_connector_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_supermetrics_connector_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_supermetrics_connector_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_supermetrics_connector_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_supermetrics_connector_matches: {
        Row: {
          account_id: string | null
          account_name: string | null
          client_id: string
          connector: string
          created_at: string
          ds_id: string
          id: number
          notes: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          client_id: string
          connector: string
          created_at?: string
          ds_id: string
          id?: number
          notes?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          client_id?: string
          connector?: string
          created_at?: string
          ds_id?: string
          id?: number
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_supermetrics_connector_matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_supermetrics_connector_matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_supermetrics_connector_matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_supermetrics_connector_matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_supermetrics_connector_matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_supermetrics_connector_matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          domain: string | null
          fiche_status: string | null
          id: string
          name: string
          slug: string | null
          status: string
          timezone: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string
          domain?: string | null
          fiche_status?: string | null
          id: string
          name: string
          slug?: string | null
          status?: string
          timezone?: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string
          domain?: string | null
          fiche_status?: string | null
          id?: string
          name?: string
          slug?: string | null
          status?: string
          timezone?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      content_items: {
        Row: {
          client_id: string
          content_type: string | null
          created_at: string
          funnel_stage: string | null
          id: string
          opportunity_id: string | null
          payload: Json
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          content_type?: string | null
          created_at?: string
          funnel_stage?: string | null
          id?: string
          opportunity_id?: string | null
          payload?: Json
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          content_type?: string | null
          created_at?: string
          funnel_stage?: string | null
          id?: string
          opportunity_id?: string | null
          payload?: Json
          status?: string
          title?: string
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
          comments: number
          content_id: string
          created_at: string
          engagement_rate: number
          id: string
          impressions: number
          likes: number
          measured_at: string
          open_rate: number | null
          retention_rate: number | null
          sends: number
          shares: number
          top_traffic_source: string | null
          unsubscribes: number
          updated_at: string
          views: number
        }
        Insert: {
          avg_time_on_page?: number | null
          avg_watch_duration?: number | null
          bounce_rate?: number | null
          click_rate?: number | null
          comments?: number
          content_id: string
          created_at?: string
          engagement_rate?: number
          id?: string
          impressions?: number
          likes?: number
          measured_at?: string
          open_rate?: number | null
          retention_rate?: number | null
          sends?: number
          shares?: number
          top_traffic_source?: string | null
          unsubscribes?: number
          updated_at?: string
          views?: number
        }
        Update: {
          avg_time_on_page?: number | null
          avg_watch_duration?: number | null
          bounce_rate?: number | null
          click_rate?: number | null
          comments?: number
          content_id?: string
          created_at?: string
          engagement_rate?: number
          id?: string
          impressions?: number
          likes?: number
          measured_at?: string
          open_rate?: number | null
          retention_rate?: number | null
          sends?: number
          shares?: number
          top_traffic_source?: string | null
          unsubscribes?: number
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_metrics_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_metrics_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "v_contents_with_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      content_recommendations: {
        Row: {
          brief: Json
          channel: string
          client_id: string
          context_tags: string[]
          converted_at: string | null
          created_at: string
          dismissed_at: string | null
          generated_at: string
          id: string
          priority_score: number
          rationale: string
          score_breakdown: Json
          status: string
          supporting_metrics: Json
          title: string
          updated_at: string
        }
        Insert: {
          brief?: Json
          channel: string
          client_id: string
          context_tags?: string[]
          converted_at?: string | null
          created_at?: string
          dismissed_at?: string | null
          generated_at?: string
          id?: string
          priority_score: number
          rationale: string
          score_breakdown?: Json
          status?: string
          supporting_metrics?: Json
          title: string
          updated_at?: string
        }
        Update: {
          brief?: Json
          channel?: string
          client_id?: string
          context_tags?: string[]
          converted_at?: string | null
          created_at?: string
          dismissed_at?: string | null
          generated_at?: string
          id?: string
          priority_score?: number
          rationale?: string
          score_breakdown?: Json
          status?: string
          supporting_metrics?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_recommendations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_recommendations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_recommendations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "content_recommendations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_recommendations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "content_recommendations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
      content_rules: {
        Row: {
          content: Json
          created_at: string | null
          description: string | null
          id: string
          name: string
          priority: number | null
          rule_type: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          priority?: number | null
          rule_type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          priority?: number | null
          rule_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contents: {
        Row: {
          body: string | null
          channel: string
          client_id: string
          created_at: string
          id: string
          metadata: Json
          published_at: string
          source_url: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          channel: string
          client_id: string
          created_at?: string
          id?: string
          metadata?: Json
          published_at: string
          source_url?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          channel?: string
          client_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          published_at?: string
          source_url?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "contents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "contents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
      deliverables: {
        Row: {
          archived_at: string | null
          channel: string | null
          client_id: string
          content_type: string | null
          created_at: string
          description: string | null
          error_message: string | null
          file_size: number | null
          filename: string
          generated_by: string | null
          generation_meta: Json | null
          id: string
          is_archived: boolean | null
          notion_page_id: string | null
          notion_url: string | null
          onedrive_path: string | null
          period: string | null
          sharepoint_url: string | null
          skill_name: string | null
          status: string
          storage_bucket: string | null
          storage_path: string | null
          sub_type: string | null
          tags: string[] | null
          title: string | null
          type: string
          updated_at: string
          version: number | null
        }
        Insert: {
          archived_at?: string | null
          channel?: string | null
          client_id: string
          content_type?: string | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          file_size?: number | null
          filename: string
          generated_by?: string | null
          generation_meta?: Json | null
          id?: string
          is_archived?: boolean | null
          notion_page_id?: string | null
          notion_url?: string | null
          onedrive_path?: string | null
          period?: string | null
          sharepoint_url?: string | null
          skill_name?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          sub_type?: string | null
          tags?: string[] | null
          title?: string | null
          type: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          archived_at?: string | null
          channel?: string | null
          client_id?: string
          content_type?: string | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          file_size?: number | null
          filename?: string
          generated_by?: string | null
          generation_meta?: Json | null
          id?: string
          is_archived?: boolean | null
          notion_page_id?: string | null
          notion_url?: string | null
          onedrive_path?: string | null
          period?: string | null
          sharepoint_url?: string | null
          skill_name?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          sub_type?: string | null
          tags?: string[] | null
          title?: string | null
          type?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
      home_kpis: {
        Row: {
          client_id: string
          created_at: string
          delta: number | null
          id: string
          key: string
          label: string
          trend: string | null
          updated_at: string
          value: string
        }
        Insert: {
          client_id: string
          created_at?: string
          delta?: number | null
          id?: string
          key: string
          label: string
          trend?: string | null
          updated_at?: string
          value: string
        }
        Update: {
          client_id?: string
          created_at?: string
          delta?: number | null
          id?: string
          key?: string
          label?: string
          trend?: string | null
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      insights_items: {
        Row: {
          client_id: string
          created_at: string
          id: string
          impact: string | null
          occurred_at: string | null
          payload: Json
          source: string
          status: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          impact?: string | null
          occurred_at?: string | null
          payload?: Json
          source: string
          status?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          impact?: string | null
          occurred_at?: string | null
          payload?: Json
          source?: string
          status?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_sync_runs: {
        Row: {
          client_id: string | null
          completed_at: string | null
          connector: string
          created_at: string
          error_details: Json | null
          error_message: string | null
          id: string
          metrics: Json
          provider: string
          request_payload: Json | null
          sample_payload: Json | null
          started_at: string
          started_by: string | null
          status: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          connector: string
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          metrics?: Json
          provider: string
          request_payload?: Json | null
          sample_payload?: Json | null
          started_at?: string
          started_by?: string | null
          status?: string
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          connector?: string
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          metrics?: Json
          provider?: string
          request_payload?: Json | null
          sample_payload?: Json | null
          started_at?: string
          started_by?: string | null
          status?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      lemlist_contacts_cache: {
        Row: {
          client_id: string
          company: string | null
          contacted_at: string | null
          created_at: string
          email: string | null
          external_contact_id: string
          full_name: string | null
          id: string
          raw: Json
          source: string | null
          status: string | null
          synced_at: string
          updated_at: string
        }
        Insert: {
          client_id: string
          company?: string | null
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          external_contact_id: string
          full_name?: string | null
          id?: string
          raw?: Json
          source?: string | null
          status?: string | null
          synced_at?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          company?: string | null
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          external_contact_id?: string
          full_name?: string | null
          id?: string
          raw?: Json
          source?: string | null
          status?: string | null
          synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      linkedin_accounts: {
        Row: {
          client_id: string
          created_at: string
          id: string
          linkedin_account_id: string
          linkedin_page_name: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          linkedin_account_id: string
          linkedin_page_name: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          linkedin_account_id?: string
          linkedin_page_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linkedin_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linkedin_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "linkedin_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linkedin_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "linkedin_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
      pipeline_runs: {
        Row: {
          clients_processed: Json
          completed_at: string | null
          created_at: string
          id: string
          layers_completed: Json
          run_date: string
          run_type: string
          started_at: string
          status: string
          steps_log: Json
          summary: string | null
          triggered_by: string
        }
        Insert: {
          clients_processed?: Json
          completed_at?: string | null
          created_at?: string
          id?: string
          layers_completed?: Json
          run_date?: string
          run_type: string
          started_at?: string
          status?: string
          steps_log?: Json
          summary?: string | null
          triggered_by?: string
        }
        Update: {
          clients_processed?: Json
          completed_at?: string | null
          created_at?: string
          id?: string
          layers_completed?: Json
          run_date?: string
          run_type?: string
          started_at?: string
          status?: string
          steps_log?: Json
          summary?: string | null
          triggered_by?: string
        }
        Relationships: []
      }
      plan_tasks: {
        Row: {
          ai_generated: boolean
          assignee: string | null
          client_id: string
          comments: Json
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          linked_campaign: string | null
          linked_content_id: string | null
          linked_content_type: string | null
          priority: string
          source_module: string | null
          status: string
          subtasks: Json
          tags: Json
          title: string
          updated_at: string
          wrike_permalink: string | null
          wrike_project_id: string | null
          wrike_step_id: string | null
          wrike_task_id: string | null
        }
        Insert: {
          ai_generated?: boolean
          assignee?: string | null
          client_id: string
          comments?: Json
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          linked_campaign?: string | null
          linked_content_id?: string | null
          linked_content_type?: string | null
          priority?: string
          source_module?: string | null
          status?: string
          subtasks?: Json
          tags?: Json
          title: string
          updated_at?: string
          wrike_permalink?: string | null
          wrike_project_id?: string | null
          wrike_step_id?: string | null
          wrike_task_id?: string | null
        }
        Update: {
          ai_generated?: boolean
          assignee?: string | null
          client_id?: string
          comments?: Json
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          linked_campaign?: string | null
          linked_content_id?: string | null
          linked_content_type?: string | null
          priority?: string
          source_module?: string | null
          status?: string
          subtasks?: Json
          tags?: Json
          title?: string
          updated_at?: string
          wrike_permalink?: string | null
          wrike_project_id?: string | null
          wrike_step_id?: string | null
          wrike_task_id?: string | null
        }
        Relationships: []
      }
      prospect_leads: {
        Row: {
          client_id: string
          company: string
          created_at: string
          email: string | null
          engagement_score: number
          fit_score: number
          id: string
          intent_score: number
          last_activity: string | null
          name: string
          score: number
          source: string | null
          stage: string
          suggested_action: string | null
          suggested_channel: string
          updated_at: string
        }
        Insert: {
          client_id: string
          company: string
          created_at?: string
          email?: string | null
          engagement_score?: number
          fit_score?: number
          id?: string
          intent_score?: number
          last_activity?: string | null
          name: string
          score?: number
          source?: string | null
          stage?: string
          suggested_action?: string | null
          suggested_channel?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          company?: string
          created_at?: string
          email?: string | null
          engagement_score?: number
          fit_score?: number
          id?: string
          intent_score?: number
          last_activity?: string | null
          name?: string
          score?: number
          source?: string | null
          stage?: string
          suggested_action?: string | null
          suggested_channel?: string
          updated_at?: string
        }
        Relationships: []
      }
      reporting_kpis: {
        Row: {
          client_id: string
          created_at: string
          id: string
          label: string
          metric_key: string
          period_end: string | null
          period_start: string | null
          section: string
          unit: string | null
          updated_at: string
          value: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          label: string
          metric_key: string
          period_end?: string | null
          period_start?: string | null
          section: string
          unit?: string | null
          updated_at?: string
          value?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          label?: string
          metric_key?: string
          period_end?: string | null
          period_start?: string | null
          section?: string
          unit?: string | null
          updated_at?: string
          value?: number | null
        }
        Relationships: []
      }
      semrush_domain_metrics: {
        Row: {
          client_id: string
          created_at: string
          domain: string
          id: string
          keyword: string
          position: number | null
          raw: Json
          report_date: string
          search_volume: number | null
          synced_at: string
          traffic_percent: number | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          domain: string
          id?: string
          keyword: string
          position?: number | null
          raw?: Json
          report_date?: string
          search_volume?: number | null
          synced_at?: string
          traffic_percent?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          domain?: string
          id?: string
          keyword?: string
          position?: number | null
          raw?: Json
          report_date?: string
          search_volume?: number | null
          synced_at?: string
          traffic_percent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      skill_pipeline: {
        Row: {
          created_at: string
          cron_expression: string | null
          depends_on: Json
          description: string | null
          estimated_duration_min: number | null
          execution_order: number
          frequency: string
          id: string
          inputs: Json
          is_active: boolean
          layer: number
          layer_name: string
          output_destinations: Json
          outputs: Json
          parallel_group: string | null
          skill_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cron_expression?: string | null
          depends_on?: Json
          description?: string | null
          estimated_duration_min?: number | null
          execution_order: number
          frequency?: string
          id?: string
          inputs?: Json
          is_active?: boolean
          layer: number
          layer_name: string
          output_destinations?: Json
          outputs?: Json
          parallel_group?: string | null
          skill_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cron_expression?: string | null
          depends_on?: Json
          description?: string | null
          estimated_duration_min?: number | null
          execution_order?: number
          frequency?: string
          id?: string
          inputs?: Json
          is_active?: boolean
          layer?: number
          layer_name?: string
          output_destinations?: Json
          outputs?: Json
          parallel_group?: string | null
          skill_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      supermetrics_accounts: {
        Row: {
          account_id: string
          account_name: string
          created_at: string
          ds_id: string
          id: number
          updated_at: string
        }
        Insert: {
          account_id: string
          account_name: string
          created_at?: string
          ds_id: string
          id?: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          account_name?: string
          created_at?: string
          ds_id?: string
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      supermetrics_channel_metrics: {
        Row: {
          channel: string
          client_id: string
          created_at: string
          id: string
          metric_key: string
          metric_value: number
          period_end: string
          period_start: string
          provider: string
          raw: Json
          synced_at: string
          updated_at: string
        }
        Insert: {
          channel: string
          client_id: string
          created_at?: string
          id?: string
          metric_key: string
          metric_value?: number
          period_end: string
          period_start: string
          provider: string
          raw?: Json
          synced_at?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          client_id?: string
          created_at?: string
          id?: string
          metric_key?: string
          metric_value?: number
          period_end?: string
          period_start?: string
          provider?: string
          raw?: Json
          synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      windsor_campaign_metrics: {
        Row: {
          id: string
          client_id: string | null
          account_name: string | null
          campaign: string | null
          datasource: string
          date: string
          post_id: string | null
          sessions: number
          source: string | null
          raw: Json
          synced_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          account_name?: string | null
          campaign?: string | null
          datasource: string
          date: string
          post_id?: string | null
          sessions?: number
          source?: string | null
          raw?: Json
          synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          account_name?: string | null
          campaign?: string | null
          datasource?: string
          date?: string
          post_id?: string | null
          sessions?: number
          source?: string | null
          raw?: Json
          synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      windsor_linkedin_metrics: {
        Row: {
          id: string
          client_id: string | null
          date: string
          organization_follower_count: number
          followers_gain_organic: number
          followers_gain_paid: number
          raw: Json
          synced_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          date: string
          organization_follower_count?: number
          followers_gain_organic?: number
          followers_gain_paid?: number
          raw?: Json
          synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          date?: string
          organization_follower_count?: number
          followers_gain_organic?: number
          followers_gain_paid?: number
          raw?: Json
          synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tldv_meetings: {
        Row: {
          ai_summary_json: Json
          attribution_method: string | null
          client_id: string | null
          created_at: string
          duration_seconds: number | null
          happened_at: string | null
          highlights_json: Json
          id: string
          meeting_url: string | null
          name: string | null
          organizer_email: string | null
          organizer_name: string | null
          participants_count: number | null
          raw: Json
          thumbnail_url: string | null
          transcript_error: string | null
          transcript_segments: Json
          transcript_source: string | null
          transcript_status: string
          transcript_synced_at: string | null
          transcript_text: string | null
          updated_at: string
        }
        Insert: {
          ai_summary_json?: Json
          attribution_method?: string | null
          client_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          happened_at?: string | null
          highlights_json?: Json
          id: string
          meeting_url?: string | null
          name?: string | null
          organizer_email?: string | null
          organizer_name?: string | null
          participants_count?: number | null
          raw: Json
          thumbnail_url?: string | null
          transcript_error?: string | null
          transcript_segments?: Json
          transcript_source?: string | null
          transcript_status?: string
          transcript_synced_at?: string | null
          transcript_text?: string | null
          updated_at?: string
        }
        Update: {
          ai_summary_json?: Json
          attribution_method?: string | null
          client_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          happened_at?: string | null
          highlights_json?: Json
          id?: string
          meeting_url?: string | null
          name?: string | null
          organizer_email?: string | null
          organizer_name?: string | null
          participants_count?: number | null
          raw?: Json
          thumbnail_url?: string | null
          transcript_error?: string | null
          transcript_segments?: Json
          transcript_source?: string | null
          transcript_status?: string
          transcript_synced_at?: string | null
          transcript_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tldv_meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tldv_meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tldv_meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "tldv_meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tldv_meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "tldv_meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
      veille_items: {
        Row: {
          client_id: string
          created_at: string | null
          details: Json | null
          generated_at: string
          id: string
          is_actionable: boolean | null
          is_read: boolean | null
          severity: string | null
          skill: string
          source: string | null
          source_url: string | null
          summary: string
          title: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          details?: Json | null
          generated_at?: string
          id?: string
          is_actionable?: boolean | null
          is_read?: boolean | null
          severity?: string | null
          skill: string
          source?: string | null
          source_url?: string | null
          summary: string
          title: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          details?: Json | null
          generated_at?: string
          id?: string
          is_actionable?: boolean | null
          is_read?: boolean | null
          severity?: string | null
          skill?: string
          source?: string | null
          source_url?: string | null
          summary?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "veille_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veille_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veille_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "veille_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veille_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "veille_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
    }
    Views: {
      deliverables_with_client: {
        Row: {
          channel: string | null
          client_id: string | null
          client_name: string | null
          client_slug: string | null
          client_status: string | null
          client_website: string | null
          content_type: string | null
          created_at: string | null
          description: string | null
          error_message: string | null
          file_size: number | null
          filename: string | null
          generated_by: string | null
          generation_meta: Json | null
          id: string | null
          is_archived: boolean | null
          notion_url: string | null
          onedrive_path: string | null
          period: string | null
          sharepoint_url: string | null
          skill_name: string | null
          status: string | null
          storage_bucket: string | null
          storage_path: string | null
          sub_type: string | null
          tags: string[] | null
          title: string | null
          type: string | null
          updated_at: string | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
      integration_sync_health: {
        Row: {
          client_id: string | null
          connector: string | null
          failed_runs: number | null
          last_completed_at: string | null
          last_started_at: string | null
          partial_runs: number | null
          provider: string | null
          success_runs: number | null
          total_runs: number | null
        }
        Relationships: []
      }
      security_rls_audit: {
        Row: {
          rls_enabled: boolean | null
          schema_name: unknown
          table_name: unknown
        }
        Relationships: []
      }
      v_active_veille: {
        Row: {
          client_id: string | null
          client_name: string | null
          details: Json | null
          generated_at: string | null
          id: string | null
          is_actionable: boolean | null
          is_read: boolean | null
          severity: string | null
          skill: string | null
          source: string | null
          source_url: string | null
          summary: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "veille_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veille_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veille_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "veille_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veille_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "veille_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
      v_client_full: {
        Row: {
          audience_cible: Json | null
          colors: Json | null
          concurrents: Json | null
          config_competitors: string[] | null
          created_at: string | null
          diagnostic_pmf: Json | null
          domain: string | null
          fiche_status: string | null
          figma_urls: Json | null
          ga4_property_id: string | null
          google_ads_id: string | null
          gsc_site_id: string | null
          hashtags: Json | null
          hubspot_analytics_id: string | null
          hubspot_portal_id: string | null
          id: string | null
          industry: string | null
          linkedin_organization_id: string | null
          market_news_keywords: string[] | null
          messages_cles: Json | null
          meteoria_project_id: string | null
          name: string | null
          notes: string | null
          notion_page_id: string | null
          onedrive_claude_path: string | null
          piliers_contenu: Json | null
          presentation: string | null
          problemes_clients: Json | null
          regles_specifiques: Json | null
          semrush_campaign_id: string | null
          semrush_project_id: string | null
          slug: string | null
          status: string | null
          style_visuel: Json | null
          ton: string | null
          types_posts: Json | null
          typographies: Json | null
          updated_at: string | null
          website_url: string | null
        }
        Relationships: []
      }
      v_content_studio_context: {
        Row: {
          audience_cible: Json | null
          client_id: string | null
          client_name: string | null
          colors: Json | null
          hashtags: Json | null
          messages_cles: Json | null
          piliers_contenu: Json | null
          regles_specifiques: Json | null
          style_visuel: Json | null
          ton: string | null
          types_posts: Json | null
        }
        Relationships: []
      }
      v_contents_with_metrics: {
        Row: {
          channel: string | null
          client_id: string | null
          client_name: string | null
          id: string | null
          latest_comments: number | null
          latest_engagement_rate: number | null
          latest_impressions: number | null
          latest_likes: number | null
          latest_shares: number | null
          latest_views: number | null
          published_at: string | null
          status: string | null
          tags: string[] | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "contents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "contents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
      v_dashboard_clients: {
        Row: {
          content_count: number | null
          deliverable_count: number | null
          domain: string | null
          fiche_status: string | null
          has_brand_guidelines: boolean | null
          has_profile: boolean | null
          id: string | null
          industry: string | null
          integration_score: number | null
          kpi_count: number | null
          last_meeting_at: string | null
          last_veille_at: string | null
          meeting_count: number | null
          name: string | null
          status: string | null
          unread_veille_count: number | null
          website_url: string | null
        }
        Relationships: []
      }
      v_deliverables_dashboard: {
        Row: {
          client_id: string | null
          client_name: string | null
          client_slug: string | null
          client_status: string | null
          deliverables_by_type: Json | null
          last_deliverable_at: string | null
          last_month: number | null
          this_month: number | null
          total_deliverables: number | null
        }
        Relationships: []
      }
      v_deliverables_timeline: {
        Row: {
          channel: string | null
          client_id: string | null
          client_name: string | null
          client_slug: string | null
          created_at: string | null
          filename: string | null
          generation_meta: Json | null
          id: string | null
          notion_url: string | null
          period: string | null
          sharepoint_url: string | null
          skill_name: string | null
          status: string | null
          storage_path: string | null
          sub_type: string | null
          tags: string[] | null
          title: string | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "deliverables_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
      v_integration_health: {
        Row: {
          client_id: string | null
          client_name: string | null
          ga4_property_id: string | null
          google_ads_id: string | null
          gsc_site_id: string | null
          hubspot_active_mappings: number | null
          hubspot_portal_id: string | null
          last_successful_sync: string | null
          linkedin_organization_id: string | null
          linkedin_pages: string | null
          meteoria_project_id: string | null
          notion_page_id: string | null
          semrush_active_mappings: number | null
          semrush_project_id: string | null
        }
        Relationships: []
      }
      v_kpis_with_evolution: {
        Row: {
          client_id: string | null
          current_period_end: string | null
          current_period_start: string | null
          current_value: number | null
          evolution_pct: number | null
          label: string | null
          metric_key: string | null
          previous_period_start: string | null
          previous_value: number | null
          section: string | null
          unit: string | null
        }
        Relationships: []
      }
      v_latest_channel_metrics: {
        Row: {
          channel: string | null
          client_id: string | null
          client_name: string | null
          metric_key: string | null
          metric_value: number | null
          period_end: string | null
          period_start: string | null
          provider: string | null
        }
        Relationships: []
      }
      v_latest_kpis: {
        Row: {
          client_id: string | null
          client_name: string | null
          label: string | null
          metric_key: string | null
          period_end: string | null
          period_start: string | null
          section: string | null
          unit: string | null
          value: number | null
        }
        Relationships: []
      }
      v_pipeline_sequence: {
        Row: {
          cron_expression: string | null
          depends_on: Json | null
          description: string | null
          estimated_duration_min: number | null
          execution_order: number | null
          frequency: string | null
          inputs: Json | null
          is_active: boolean | null
          layer: number | null
          layer_name: string | null
          output_destinations: Json | null
          outputs: Json | null
          parallel_group: string | null
          skill_name: string | null
        }
        Insert: {
          cron_expression?: string | null
          depends_on?: Json | null
          description?: string | null
          estimated_duration_min?: number | null
          execution_order?: number | null
          frequency?: string | null
          inputs?: Json | null
          is_active?: boolean | null
          layer?: number | null
          layer_name?: string | null
          output_destinations?: Json | null
          outputs?: Json | null
          parallel_group?: string | null
          skill_name?: string | null
        }
        Update: {
          cron_expression?: string | null
          depends_on?: Json | null
          description?: string | null
          estimated_duration_min?: number | null
          execution_order?: number | null
          frequency?: string | null
          inputs?: Json | null
          is_active?: boolean | null
          layer?: number | null
          layer_name?: string | null
          output_destinations?: Json | null
          outputs?: Json | null
          parallel_group?: string | null
          skill_name?: string | null
        }
        Relationships: []
      }
      v_recent_meetings: {
        Row: {
          ai_summary_json: Json | null
          client_id: string | null
          client_name: string | null
          duration_seconds: number | null
          happened_at: string | null
          highlights_json: Json | null
          id: string | null
          meeting_name: string | null
          meeting_url: string | null
          organizer_name: string | null
          transcript_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tldv_meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tldv_meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tldv_meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_content_studio_context"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "tldv_meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tldv_meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_deliverables_dashboard"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "tldv_meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_integration_health"
            referencedColumns: ["client_id"]
          },
        ]
      }
    }
    Functions: {
      get_client_kpis_summary: { Args: { p_client_id: string }; Returns: Json }
      get_dashboard_summary: { Args: never; Returns: Json }
      mark_all_veille_read: { Args: { p_client_id: string }; Returns: number }
      mark_veille_actionable:
        | {
            Args: { p_actionable: boolean; p_veille_id: string }
            Returns: undefined
          }
        | {
            Args: { p_actionable?: boolean; p_veille_id: string }
            Returns: undefined
          }
      mark_veille_read: { Args: { p_veille_id: string }; Returns: undefined }
      register_deliverable: {
        Args: {
          p_channel?: string
          p_client_id: string
          p_content_type?: string
          p_description?: string
          p_file_size?: number
          p_filename: string
          p_generated_by?: string
          p_generation_meta?: Json
          p_notion_page_id?: string
          p_notion_url?: string
          p_onedrive_path?: string
          p_period?: string
          p_sharepoint_url?: string
          p_skill_name?: string
          p_status?: string
          p_storage_path?: string
          p_sub_type?: string
          p_tags?: string[]
          p_title?: string
          p_type: string
        }
        Returns: Json
      }
      search_clients: {
        Args: { p_query: string }
        Returns: {
          client_id: string
          client_name: string
          match_excerpt: string
          match_field: string
          relevance: number
        }[]
      }
      update_content_status:
        | {
            Args: { p_content_id: string; p_status: string }
            Returns: undefined
          }
        | {
            Args: { p_content_id: string; p_status: string }
            Returns: undefined
          }
      update_recommendation_status:
        | { Args: { p_rec_id: string; p_status: string }; Returns: undefined }
        | { Args: { p_rec_id: string; p_status: string }; Returns: undefined }
      upsert_brand_guidelines: {
        Args: {
          p_client_id: string
          p_colors?: Json
          p_figma_urls?: Json
          p_style_visuel?: Json
          p_typographies?: Json
        }
        Returns: undefined
      }
      upsert_client_profile:
        | {
            Args: {
              p_audience_cible?: Json
              p_client_id: string
              p_concurrents?: Json
              p_diagnostic_pmf?: Json
              p_hashtags?: Json
              p_messages_cles?: Json
              p_notes?: string
              p_piliers_contenu?: Json
              p_presentation?: string
              p_problemes_clients?: Json
              p_regles_specifiques?: Json
              p_ton?: string
              p_types_posts?: Json
            }
            Returns: undefined
          }
        | {
            Args: {
              p_client_id: string
              p_notes?: string
              p_presentation?: string
              p_ton?: string
            }
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
