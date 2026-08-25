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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          display_name: string
          email: string
          id: string
          last_login_at: string | null
          role: Database["public"]["Enums"]["admin_role"]
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          email: string
          id: string
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          email?: string
          id?: string
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
      ai_generation_logs: {
        Row: {
          created_at: string
          error_message: string | null
          execution_ms: number | null
          grant_id: string | null
          id: string
          model: string
          prompt_name: string
          prompt_version: string
          status: Database["public"]["Enums"]["ai_job_status"]
          tokens_input: number | null
          tokens_output: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_ms?: number | null
          grant_id?: string | null
          id?: string
          model: string
          prompt_name: string
          prompt_version: string
          status: Database["public"]["Enums"]["ai_job_status"]
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_ms?: number | null
          grant_id?: string | null
          id?: string
          model?: string
          prompt_name?: string
          prompt_version?: string
          status?: Database["public"]["Enums"]["ai_job_status"]
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_logs_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          ip_address: unknown
          message: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["message_status"]
          subject: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          ip_address?: unknown
          message: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown
          message?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          flag_url: string | null
          grant_count: number
          id: string
          iso_code: string
          iso_code_3: string | null
          name: string
          organization_count: number
          slug: string
          status: Database["public"]["Enums"]["entity_status"]
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency: string
          deleted_at?: string | null
          description?: string | null
          flag_url?: string | null
          grant_count?: number
          id?: string
          iso_code: string
          iso_code_3?: string | null
          name: string
          organization_count?: number
          slug: string
          status?: Database["public"]["Enums"]["entity_status"]
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          flag_url?: string | null
          grant_count?: number
          id?: string
          iso_code?: string
          iso_code_3?: string | null
          name?: string
          organization_count?: number
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"]
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crawler_pages: {
        Row: {
          content_hash: string | null
          created_at: string
          etag: string | null
          http_status: number | null
          id: string
          last_crawled_at: string | null
          last_modified_at: string | null
          source_id: string
          updated_at: string
          url: string
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          etag?: string | null
          http_status?: number | null
          id?: string
          last_crawled_at?: string | null
          last_modified_at?: string | null
          source_id: string
          updated_at?: string
          url: string
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          etag?: string | null
          http_status?: number | null
          id?: string
          last_crawled_at?: string | null
          last_modified_at?: string | null
          source_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "crawler_pages_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "crawler_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      crawler_queue: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          last_error: string | null
          priority: number
          retry_count: number
          scheduled_for: string
          source_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          url: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          priority?: number
          retry_count?: number
          scheduled_for?: string
          source_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          url: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          priority?: number
          retry_count?: number
          scheduled_for?: string
          source_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "crawler_queue_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "crawler_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      crawler_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          duplicates_found: number
          duration_ms: number | null
          errors: number
          grants_new: number
          grants_updated: number
          id: string
          logs: Json | null
          page_limit: number
          pages_scanned: number
          queued_at: string
          requested_by: string | null
          source_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          triggered_by: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duplicates_found?: number
          duration_ms?: number | null
          errors?: number
          grants_new?: number
          grants_updated?: number
          id?: string
          logs?: Json | null
          page_limit?: number
          pages_scanned?: number
          queued_at?: string
          requested_by?: string | null
          source_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          triggered_by?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duplicates_found?: number
          duration_ms?: number | null
          errors?: number
          grants_new?: number
          grants_updated?: number
          id?: string
          logs?: Json | null
          page_limit?: number
          pages_scanned?: number
          queued_at?: string
          requested_by?: string | null
          source_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "crawler_runs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crawler_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "crawler_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      crawler_sources: {
        Row: {
          adapter_key: string
          base_url: string
          country_id: string
          crawl_frequency: string
          created_at: string
          id: string
          last_run_at: string | null
          max_concurrency: number
          name: string
          organization_id: string | null
          priority: number
          request_delay_ms: number
          respect_robots_txt: boolean
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          adapter_key: string
          base_url: string
          country_id: string
          crawl_frequency?: string
          created_at?: string
          id?: string
          last_run_at?: string | null
          max_concurrency?: number
          name: string
          organization_id?: string | null
          priority?: number
          request_delay_ms?: number
          respect_robots_txt?: boolean
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          adapter_key?: string
          base_url?: string
          country_id?: string
          crawl_frequency?: string
          created_at?: string
          id?: string
          last_run_at?: string | null
          max_concurrency?: number
          name?: string
          organization_id?: string | null
          priority?: number
          request_delay_ms?: number
          respect_robots_txt?: boolean
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crawler_sources_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crawler_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicate_detection: {
        Row: {
          confidence: number
          created_at: string
          decision: Database["public"]["Enums"]["duplicate_decision"]
          grant_a_id: string
          grant_b_id: string
          id: string
          method: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          confidence: number
          created_at?: string
          decision?: Database["public"]["Enums"]["duplicate_decision"]
          grant_a_id: string
          grant_b_id: string
          id?: string
          method: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          confidence?: number
          created_at?: string
          decision?: Database["public"]["Enums"]["duplicate_decision"]
          grant_a_id?: string
          grant_b_id?: string
          id?: string
          method?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_detection_grant_a_id_fkey"
            columns: ["grant_a_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_detection_grant_b_id_fkey"
            columns: ["grant_b_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_items: {
        Row: {
          answer: string
          created_at: string
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["faq_entity_type"]
          id: string
          question: string
          sort_order: number
          source: Database["public"]["Enums"]["content_source"]
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          entity_id?: string | null
          entity_type: Database["public"]["Enums"]["faq_entity_type"]
          id?: string
          question: string
          sort_order?: number
          source?: Database["public"]["Enums"]["content_source"]
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["faq_entity_type"]
          id?: string
          question?: string
          sort_order?: number
          source?: Database["public"]["Enums"]["content_source"]
          updated_at?: string
        }
        Relationships: []
      }
      grant_ai_content: {
        Row: {
          confidence: number | null
          created_at: string
          grant_id: string
          id: string
          keywords: string[]
          last_generated_at: string
          model_used: string
          prompt_version: string
          structured_json: Json | null
          summary: string | null
          tokens_input: number | null
          tokens_output: number | null
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          grant_id: string
          id?: string
          keywords?: string[]
          last_generated_at?: string
          model_used: string
          prompt_version: string
          structured_json?: Json | null
          summary?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          grant_id?: string
          id?: string
          keywords?: string[]
          last_generated_at?: string
          model_used?: string
          prompt_version?: string
          structured_json?: Json | null
          summary?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grant_ai_content_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: true
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_answer_capsules: {
        Row: {
          answer: string
          created_at: string
          grant_id: string
          id: string
          position: number
          question: string
          source: Database["public"]["Enums"]["content_source"]
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          grant_id: string
          id?: string
          position?: number
          question: string
          source?: Database["public"]["Enums"]["content_source"]
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          grant_id?: string
          id?: string
          position?: number
          question?: string
          source?: Database["public"]["Enums"]["content_source"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grant_answer_capsules_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_categories: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          grant_count: number
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          grant_count?: number
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          grant_count?: number
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grant_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "grant_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_category_relations: {
        Row: {
          category_id: string
          created_at: string
          grant_id: string
          is_primary: boolean
        }
        Insert: {
          category_id: string
          created_at?: string
          grant_id: string
          is_primary?: boolean
        }
        Update: {
          category_id?: string
          created_at?: string
          grant_id?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "grant_category_relations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "grant_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_category_relations_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_documents: {
        Row: {
          created_at: string
          document_type: string | null
          file_size: number | null
          file_url: string
          grant_id: string
          id: string
          mime_type: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          file_size?: number | null
          file_url: string
          grant_id: string
          id?: string
          mime_type?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string | null
          file_size?: number | null
          file_url?: string
          grant_id?: string
          id?: string
          mime_type?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grant_documents_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_history: {
        Row: {
          action: string
          created_at: string
          description: string | null
          grant_id: string
          id: string
          performed_by: string | null
          performed_by_type: Database["public"]["Enums"]["actor_type"]
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          grant_id: string
          id?: string
          performed_by?: string | null
          performed_by_type?: Database["public"]["Enums"]["actor_type"]
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          grant_id?: string
          id?: string
          performed_by?: string | null
          performed_by_type?: Database["public"]["Enums"]["actor_type"]
        }
        Relationships: [
          {
            foreignKeyName: "grant_history_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_sources: {
        Row: {
          confidence_score: number | null
          created_at: string
          grant_id: string
          id: string
          last_checked: string | null
          source_name: string | null
          source_type: Database["public"]["Enums"]["grant_source_type"]
          source_url: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          grant_id: string
          id?: string
          last_checked?: string | null
          source_name?: string | null
          source_type?: Database["public"]["Enums"]["grant_source_type"]
          source_url: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          grant_id?: string
          id?: string
          last_checked?: string | null
          source_name?: string | null
          source_type?: Database["public"]["Enums"]["grant_source_type"]
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "grant_sources_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_tag_relations: {
        Row: {
          created_at: string
          grant_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          grant_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          grant_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grant_tag_relations_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_tag_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "grant_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      grant_versions: {
        Row: {
          change_reason: string | null
          content_hash: string | null
          created_at: string
          created_by: string | null
          created_by_type: Database["public"]["Enums"]["actor_type"]
          grant_id: string
          id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          created_by_type?: Database["public"]["Enums"]["actor_type"]
          grant_id: string
          id?: string
          snapshot: Json
          version_number: number
        }
        Update: {
          change_reason?: string | null
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          created_by_type?: Database["public"]["Enums"]["actor_type"]
          grant_id?: string
          id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "grant_versions_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
        ]
      }
      grants: {
        Row: {
          ai_confidence: number | null
          application_url: string | null
          closes_at: string | null
          content_hash: string | null
          country_id: string
          created_at: string
          currency: string
          current_version: number
          deleted_at: string | null
          eligibility: string | null
          featured: boolean
          full_description: string | null
          funding_amount: number | null
          grant_type: Database["public"]["Enums"]["grant_funding_type"]
          id: string
          is_federal: boolean
          is_private: boolean
          last_verified_at: string | null
          maximum_amount: number | null
          minimum_amount: number | null
          official_url: string | null
          opens_at: string | null
          organization_id: string
          published_at: string | null
          search_vector: unknown
          short_description: string | null
          slug: string
          source_url: string | null
          state_id: string | null
          status: Database["public"]["Enums"]["grant_status"]
          title: string
          updated_at: string
        }
        Insert: {
          ai_confidence?: number | null
          application_url?: string | null
          closes_at?: string | null
          content_hash?: string | null
          country_id: string
          created_at?: string
          currency: string
          current_version?: number
          deleted_at?: string | null
          eligibility?: string | null
          featured?: boolean
          full_description?: string | null
          funding_amount?: number | null
          grant_type?: Database["public"]["Enums"]["grant_funding_type"]
          id?: string
          is_federal?: boolean
          is_private?: boolean
          last_verified_at?: string | null
          maximum_amount?: number | null
          minimum_amount?: number | null
          official_url?: string | null
          opens_at?: string | null
          organization_id: string
          published_at?: string | null
          search_vector?: unknown
          short_description?: string | null
          slug: string
          source_url?: string | null
          state_id?: string | null
          status?: Database["public"]["Enums"]["grant_status"]
          title: string
          updated_at?: string
        }
        Update: {
          ai_confidence?: number | null
          application_url?: string | null
          closes_at?: string | null
          content_hash?: string | null
          country_id?: string
          created_at?: string
          currency?: string
          current_version?: number
          deleted_at?: string | null
          eligibility?: string | null
          featured?: boolean
          full_description?: string | null
          funding_amount?: number | null
          grant_type?: Database["public"]["Enums"]["grant_funding_type"]
          id?: string
          is_federal?: boolean
          is_private?: boolean
          last_verified_at?: string | null
          maximum_amount?: number | null
          minimum_amount?: number | null
          official_url?: string | null
          opens_at?: string | null
          organization_id?: string
          published_at?: string | null
          search_vector?: unknown
          short_description?: string | null
          slug?: string
          source_url?: string | null
          state_id?: string | null
          status?: Database["public"]["Enums"]["grant_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grants_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grants_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      media_library: {
        Row: {
          alt_text: string | null
          created_at: string
          file_name: string
          file_size: number | null
          height: number | null
          id: string
          mime_type: string
          storage_path: string
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type: string
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_library_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          country_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          email: string | null
          grant_count: number
          id: string
          logo_url: string | null
          name: string
          organization_type: Database["public"]["Enums"]["organization_type"]
          phone: string | null
          slug: string
          state_id: string | null
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          country_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          grant_count?: number
          id?: string
          logo_url?: string | null
          name: string
          organization_type: Database["public"]["Enums"]["organization_type"]
          phone?: string | null
          slug: string
          state_id?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          country_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          grant_count?: number
          id?: string
          logo_url?: string | null
          name?: string
          organization_type?: Database["public"]["Enums"]["organization_type"]
          phone?: string | null
          slug?: string
          state_id?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      same_as_profiles: {
        Row: {
          created_at: string
          display_order: number
          enabled: boolean
          id: string
          is_primary: boolean
          label: string
          platform: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          enabled?: boolean
          id?: string
          is_primary?: boolean
          label: string
          platform: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          enabled?: boolean
          id?: string
          is_primary?: boolean
          label?: string
          platform?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      schema_markup: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["seo_entity_type"]
          generated_at: string
          id: string
          schema_json: Json
          schema_type: string
          schema_version: number
          static_page_key: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type: Database["public"]["Enums"]["seo_entity_type"]
          generated_at?: string
          id?: string
          schema_json: Json
          schema_type: string
          schema_version?: number
          static_page_key?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["seo_entity_type"]
          generated_at?: string
          id?: string
          schema_json?: Json
          schema_type?: string
          schema_version?: number
          static_page_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_metadata: {
        Row: {
          canonical_url: string | null
          created_at: string
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["seo_entity_type"]
          focus_keywords: string[]
          id: string
          meta_description: string | null
          meta_title: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          robots: string
          schema_version: number
          static_page_key: string | null
          twitter_description: string | null
          twitter_title: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: Database["public"]["Enums"]["seo_entity_type"]
          focus_keywords?: string[]
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          robots?: string
          schema_version?: number
          static_page_key?: string | null
          twitter_description?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["seo_entity_type"]
          focus_keywords?: string[]
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          robots?: string
          schema_version?: number
          static_page_key?: string | null
          twitter_description?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_redirects: {
        Row: {
          created_at: string
          destination_path: string
          enabled: boolean
          hit_count: number
          id: string
          source_path: string
          status_code: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_path: string
          enabled?: boolean
          hit_count?: number
          id?: string
          source_path: string
          status_code?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_path?: string
          enabled?: boolean
          hit_count?: number
          id?: string
          source_path?: string
          status_code?: number
          updated_at?: string
        }
        Relationships: []
      }
      states: {
        Row: {
          code: string | null
          country_id: string
          created_at: string
          deleted_at: string | null
          grant_count: number
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          code?: string | null
          country_id: string
          created_at?: string
          deleted_at?: string | null
          grant_count?: number
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          code?: string | null
          country_id?: string
          created_at?: string
          deleted_at?: string | null
          grant_count?: number
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "states_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          group_name: string
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_name: string
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          group_name?: string
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_grant: {
        Args: {
          p_category_ids?: string[]
          p_change_reason?: string
          p_grant: Json
          p_primary_category_id?: string
        }
        Returns: string
      }
      admin_create_organization: {
        Args: {
          p_country_id: string
          p_name: string
          p_organization_type?: Database["public"]["Enums"]["organization_type"]
          p_website?: string
        }
        Returns: string
      }
      admin_delete_grant: {
        Args: { p_grant_id: string; p_reason?: string }
        Returns: string
      }
      admin_rename_slug: {
        Args: {
          p_entity: string
          p_id: string
          p_new_path: string
          p_new_slug: string
          p_old_path: string
        }
        Returns: string
      }
      admin_resolve_duplicate: {
        Args: {
          p_decision: Database["public"]["Enums"]["duplicate_decision"]
          p_id: string
          p_keep_grant_id?: string
          p_reason?: string
        }
        Returns: string
      }
      admin_save_grant: {
        Args: { p_change_reason?: string; p_grant_id: string; p_patch: Json }
        Returns: string
      }
      admin_set_grant_classification: {
        Args: {
          p_category_ids?: string[]
          p_change_reason?: string
          p_clear_state?: boolean
          p_country_id?: string
          p_grant_id: string
          p_is_federal?: boolean
          p_is_private?: boolean
          p_organization_id?: string
          p_primary_category_id?: string
          p_state_id?: string
        }
        Returns: string
      }
      admin_set_grant_status: {
        Args: {
          p_grant_id: string
          p_reason?: string
          p_status: Database["public"]["Enums"]["grant_status"]
        }
        Returns: string
      }
      claim_crawler_run: {
        Args: never
        Returns: {
          page_limit: number
          run_id: string
          source_id: string
          triggered_by: string
        }[]
      }
      current_admin_role: {
        Args: never
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      is_admin_at_least: {
        Args: { required: Database["public"]["Enums"]["admin_role"] }
        Returns: boolean
      }
      publish_grant: {
        Args: {
          p_actor?: Database["public"]["Enums"]["actor_type"]
          p_category_ids?: string[]
          p_change_reason?: string
          p_grant: Json
          p_primary_category_id?: string
        }
        Returns: string
      }
      reap_stalled_runs: { Args: { p_older_than?: string }; Returns: number }
      refresh_category_counts: {
        Args: { p_category_ids: string[] }
        Returns: undefined
      }
      refresh_grant_counts: {
        Args: {
          p_country_ids: string[]
          p_organization_ids: string[]
          p_state_ids: string[]
        }
        Returns: undefined
      }
      request_crawl: {
        Args: {
          p_page_limit?: number
          p_requested_by?: string
          p_source_id: string
          p_triggered_by?: string
        }
        Returns: string
      }
      slugify: { Args: { p_input: string }; Returns: string }
    }
    Enums: {
      actor_type: "crawler" | "admin" | "ai" | "system"
      admin_role: "super_admin" | "admin" | "editor" | "viewer"
      ai_job_status: "success" | "failed" | "invalid_json" | "timeout"
      content_source: "ai" | "manual"
      duplicate_decision: "duplicate" | "possible_duplicate" | "different"
      entity_status: "active" | "inactive"
      faq_entity_type:
        | "grant"
        | "country"
        | "state"
        | "category"
        | "organization"
        | "service"
        | "about"
        | "contact"
        | "home"
      grant_funding_type:
        | "competitive"
        | "formula"
        | "continuation"
        | "cooperative_agreement"
        | "tax_credit"
        | "loan"
        | "voucher"
        | "prize"
        | "fellowship"
        | "other"
      grant_source_type:
        | "official_website"
        | "rss"
        | "pdf"
        | "api"
        | "manual"
        | "crawler"
      grant_status:
        | "draft"
        | "pending_review"
        | "published"
        | "archived"
        | "expired"
      job_status: "pending" | "running" | "completed" | "failed" | "cancelled"
      message_status: "new" | "read" | "replied" | "archived"
      organization_type:
        | "government_federal"
        | "government_state"
        | "government_local"
        | "university"
        | "research_council"
        | "innovation_agency"
        | "foundation"
        | "private"
      seo_entity_type:
        | "grant"
        | "country"
        | "state"
        | "category"
        | "organization"
        | "static_page"
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
    Enums: {
      actor_type: ["crawler", "admin", "ai", "system"],
      admin_role: ["super_admin", "admin", "editor", "viewer"],
      ai_job_status: ["success", "failed", "invalid_json", "timeout"],
      content_source: ["ai", "manual"],
      duplicate_decision: ["duplicate", "possible_duplicate", "different"],
      entity_status: ["active", "inactive"],
      faq_entity_type: [
        "grant",
        "country",
        "state",
        "category",
        "organization",
        "service",
        "about",
        "contact",
        "home",
      ],
      grant_funding_type: [
        "competitive",
        "formula",
        "continuation",
        "cooperative_agreement",
        "tax_credit",
        "loan",
        "voucher",
        "prize",
        "fellowship",
        "other",
      ],
      grant_source_type: [
        "official_website",
        "rss",
        "pdf",
        "api",
        "manual",
        "crawler",
      ],
      grant_status: [
        "draft",
        "pending_review",
        "published",
        "archived",
        "expired",
      ],
      job_status: ["pending", "running", "completed", "failed", "cancelled"],
      message_status: ["new", "read", "replied", "archived"],
      organization_type: [
        "government_federal",
        "government_state",
        "government_local",
        "university",
        "research_council",
        "innovation_agency",
        "foundation",
        "private",
      ],
      seo_entity_type: [
        "grant",
        "country",
        "state",
        "category",
        "organization",
        "static_page",
      ],
    },
  },
} as const
