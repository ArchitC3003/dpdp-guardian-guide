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
      ai_config_audit_log: {
        Row: {
          change_summary: string | null
          changed_at: string
          changed_by: string | null
          id: string
          module_name: string
          new_prompt: string | null
          old_prompt: string | null
        }
        Insert: {
          change_summary?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          module_name: string
          new_prompt?: string | null
          old_prompt?: string | null
        }
        Update: {
          change_summary?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          module_name?: string
          new_prompt?: string | null
          old_prompt?: string | null
        }
        Relationships: []
      }
      ai_output_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          module_name: string
          prompt_version: string | null
          rating: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          module_name: string
          prompt_version?: string | null
          rating?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          module_name?: string
          prompt_version?: string | null
          rating?: string
        }
        Relationships: []
      }
      ai_prompt_config: {
        Row: {
          assessment_template: Json | null
          banned_phrases: Json
          id: string
          max_tokens: number
          model: string
          module_name: string
          output_rules: Json
          scoring_rubric: Json | null
          system_prompt: string
          temperature: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assessment_template?: Json | null
          banned_phrases?: Json
          id?: string
          max_tokens?: number
          model?: string
          module_name: string
          output_rules?: Json
          scoring_rubric?: Json | null
          system_prompt?: string
          temperature?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assessment_template?: Json | null
          banned_phrases?: Json
          id?: string
          max_tokens?: number
          model?: string
          module_name?: string
          output_rules?: Json
          scoring_rubric?: Json | null
          system_prompt?: string
          temperature?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_training_examples: {
        Row: {
          created_at: string
          created_by: string | null
          doc_type: string
          expected_output: string
          id: string
          input_context: string
          is_active: boolean
          module_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doc_type?: string
          expected_output?: string
          id?: string
          input_context?: string
          is_active?: boolean
          module_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doc_type?: string
          expected_output?: string
          id?: string
          input_context?: string
          is_active?: boolean
          module_name?: string
        }
        Relationships: []
      }
      artefact_comments: {
        Row: {
          artefact_id: string
          content: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          artefact_id: string
          content: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          artefact_id?: string
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artefact_comments_artefact_id_fkey"
            columns: ["artefact_id"]
            isOneToOne: false
            referencedRelation: "artefact_files"
            referencedColumns: ["id"]
          },
        ]
      }
      artefact_files: {
        Row: {
          author: string | null
          collection: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          folder: string
          framework: string | null
          id: string
          is_current_version: boolean | null
          mime_type: string | null
          parent_id: string | null
          tags: string[] | null
          uploaded_at: string
          version_number: number | null
        }
        Insert: {
          author?: string | null
          collection?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          folder: string
          framework?: string | null
          id?: string
          is_current_version?: boolean | null
          mime_type?: string | null
          parent_id?: string | null
          tags?: string[] | null
          uploaded_at?: string
          version_number?: number | null
        }
        Update: {
          author?: string | null
          collection?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          folder?: string
          framework?: string | null
          id?: string
          is_current_version?: boolean | null
          mime_type?: string | null
          parent_id?: string | null
          tags?: string[] | null
          uploaded_at?: string
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artefact_files_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "artefact_files"
            referencedColumns: ["id"]
          },
        ]
      }
      artefact_pins: {
        Row: {
          artefact_id: string
          created_at: string | null
          id: string
          pin_type: string
          user_id: string
        }
        Insert: {
          artefact_id: string
          created_at?: string | null
          id?: string
          pin_type?: string
          user_id: string
        }
        Update: {
          artefact_id?: string
          created_at?: string | null
          id?: string
          pin_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artefact_pins_artefact_id_fkey"
            columns: ["artefact_id"]
            isOneToOne: false
            referencedRelation: "artefact_files"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_checks: {
        Row: {
          assessment_id: string
          check_id: string
          domain: string
          evidence_status: string | null
          framework_id: string | null
          id: string
          observation: string | null
          owner: string | null
          priority: string | null
          requirement_id: string | null
          status: string | null
        }
        Insert: {
          assessment_id: string
          check_id: string
          domain: string
          evidence_status?: string | null
          framework_id?: string | null
          id?: string
          observation?: string | null
          owner?: string | null
          priority?: string | null
          requirement_id?: string | null
          status?: string | null
        }
        Update: {
          assessment_id?: string
          check_id?: string
          domain?: string
          evidence_status?: string | null
          framework_id?: string | null
          id?: string
          observation?: string | null
          owner?: string | null
          priority?: string | null
          requirement_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_checks_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_checks_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "assessment_frameworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_checks_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "framework_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_frameworks: {
        Row: {
          colour: string
          created_at: string
          created_by: string | null
          description: string | null
          effective_date: string | null
          icon_name: string
          id: string
          is_active: boolean
          is_default: boolean
          jurisdiction: string
          name: string
          regulatory_body: string | null
          short_code: string
          updated_at: string
          version: string
        }
        Insert: {
          colour?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          effective_date?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          jurisdiction?: string
          name: string
          regulatory_body?: string | null
          short_code: string
          updated_at?: string
          version?: string
        }
        Update: {
          colour?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          effective_date?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          jurisdiction?: string
          name?: string
          regulatory_body?: string | null
          short_code?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      assessment_template_frameworks: {
        Row: {
          framework_id: string
          id: string
          template_id: string
        }
        Insert: {
          framework_id: string
          id?: string
          template_id: string
        }
        Update: {
          framework_id?: string
          id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_template_frameworks_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "assessment_frameworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_template_frameworks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "assessment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          template_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      assessment_versions: {
        Row: {
          assessment_id: string
          created_at: string
          created_by: string | null
          id: string
          snapshot_data: Json
          version_number: number
        }
        Insert: {
          assessment_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot_data?: Json
          version_number: number
        }
        Update: {
          assessment_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot_data?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_versions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          created_at: string
          framework_ids: string[] | null
          id: string
          notes: string | null
          org_data_subjects: string | null
          org_employees: string | null
          org_entity_type: string | null
          org_industry: string | null
          org_locations: string | null
          org_name: string | null
          org_regulators: string | null
          special_status: Json | null
          status: string
          template_id: string | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          framework_ids?: string[] | null
          id?: string
          notes?: string | null
          org_data_subjects?: string | null
          org_employees?: string | null
          org_entity_type?: string | null
          org_industry?: string | null
          org_locations?: string | null
          org_name?: string | null
          org_regulators?: string | null
          special_status?: Json | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          framework_ids?: string[] | null
          id?: string
          notes?: string | null
          org_data_subjects?: string | null
          org_employees?: string | null
          org_entity_type?: string | null
          org_industry?: string | null
          org_locations?: string | null
          org_name?: string | null
          org_regulators?: string | null
          special_status?: Json | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "assessment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          entity_id: string | null
          entity_type: string
          event_timestamp: string
          id: string
          ip_address: string | null
          new_state: string | null
          notes: string | null
          previous_state: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string
          entity_id?: string | null
          entity_type: string
          event_timestamp?: string
          id?: string
          ip_address?: string | null
          new_state?: string | null
          notes?: string | null
          previous_state?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          entity_id?: string | null
          entity_type?: string
          event_timestamp?: string
          id?: string
          ip_address?: string | null
          new_state?: string | null
          notes?: string | null
          previous_state?: string | null
        }
        Relationships: []
      }
      consent_receipts: {
        Row: {
          action_type: string
          banner_language: string | null
          categories_accepted: string[] | null
          categories_rejected: string[] | null
          consent_timestamp: string
          created_at: string
          id: string
          ip_address: string | null
          notice_version_id: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          withdrawal_timestamp: string | null
        }
        Insert: {
          action_type?: string
          banner_language?: string | null
          categories_accepted?: string[] | null
          categories_rejected?: string[] | null
          consent_timestamp?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          notice_version_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          withdrawal_timestamp?: string | null
        }
        Update: {
          action_type?: string
          banner_language?: string | null
          categories_accepted?: string[] | null
          categories_rejected?: string[] | null
          consent_timestamp?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          notice_version_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          withdrawal_timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_receipts_notice_version_id_fkey"
            columns: ["notice_version_id"]
            isOneToOne: false
            referencedRelation: "privacy_notices"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_framework_mappings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          mapping_notes: string | null
          mapping_type: string
          source_requirement_id: string
          target_requirement_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          mapping_notes?: string | null
          mapping_type?: string
          source_requirement_id: string
          target_requirement_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          mapping_notes?: string | null
          mapping_type?: string
          source_requirement_id?: string
          target_requirement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_framework_mappings_source_requirement_id_fkey"
            columns: ["source_requirement_id"]
            isOneToOne: false
            referencedRelation: "framework_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_framework_mappings_target_requirement_id_fkey"
            columns: ["target_requirement_id"]
            isOneToOne: false
            referencedRelation: "framework_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      dept_grid: {
        Row: {
          assessment_id: string
          control_id: number
          department: string
          id: string
          status: string | null
        }
        Insert: {
          assessment_id: string
          control_id: number
          department: string
          id?: string
          status?: string | null
        }
        Update: {
          assessment_id?: string
          control_id?: number
          department?: string
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dept_grid_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      file_references: {
        Row: {
          assessment_id: string
          category: string
          created_at: string
          file_path: string
          id: string
          label: string
        }
        Insert: {
          assessment_id: string
          category: string
          created_at?: string
          file_path?: string
          id?: string
          label?: string
        }
        Update: {
          assessment_id?: string
          category?: string
          created_at?: string
          file_path?: string
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_references_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      framework_clause_library: {
        Row: {
          clause_ref: string
          clause_text: string
          framework_name: string
          id: string
          is_active: boolean
        }
        Insert: {
          clause_ref: string
          clause_text?: string
          framework_name: string
          id?: string
          is_active?: boolean
        }
        Update: {
          clause_ref?: string
          clause_text?: string
          framework_name?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      framework_dept_controls: {
        Row: {
          control_description: string
          control_id: number
          created_at: string
          display_order: number
          framework_id: string
          id: string
          is_active: boolean
          risk_level: string
        }
        Insert: {
          control_description: string
          control_id: number
          created_at?: string
          display_order?: number
          framework_id: string
          id?: string
          is_active?: boolean
          risk_level?: string
        }
        Update: {
          control_description?: string
          control_id?: number
          created_at?: string
          display_order?: number
          framework_id?: string
          id?: string
          is_active?: boolean
          risk_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "framework_dept_controls_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "assessment_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      framework_domains: {
        Row: {
          code: string
          conditional_flag: string | null
          created_at: string
          description: string | null
          display_order: number
          framework_id: string
          id: string
          is_active: boolean
          name: string
          penalty_ref: string | null
          section_ref: string | null
        }
        Insert: {
          code: string
          conditional_flag?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          framework_id: string
          id?: string
          is_active?: boolean
          name: string
          penalty_ref?: string | null
          section_ref?: string | null
        }
        Update: {
          code?: string
          conditional_flag?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          framework_id?: string
          id?: string
          is_active?: boolean
          name?: string
          penalty_ref?: string | null
          section_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "framework_domains_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "assessment_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      framework_policy_artefacts: {
        Row: {
          artefact_name: string
          category_code: string
          category_name: string
          created_at: string
          display_order: number
          framework_id: string
          id: string
          is_active: boolean
          item_code: string
        }
        Insert: {
          artefact_name: string
          category_code: string
          category_name: string
          created_at?: string
          display_order?: number
          framework_id: string
          id?: string
          is_active?: boolean
          item_code: string
        }
        Update: {
          artefact_name?: string
          category_code?: string
          category_name?: string
          created_at?: string
          display_order?: number
          framework_id?: string
          id?: string
          is_active?: boolean
          item_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "framework_policy_artefacts_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "assessment_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      framework_requirements: {
        Row: {
          created_at: string
          description: string
          display_order: number
          domain_id: string
          evidence_type: string
          guidance: string | null
          id: string
          is_active: boolean
          item_code: string
          risk_level: string
          sdf_only: boolean
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          domain_id: string
          evidence_type?: string
          guidance?: string | null
          id?: string
          is_active?: boolean
          item_code: string
          risk_level?: string
          sdf_only?: boolean
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          domain_id?: string
          evidence_type?: string
          guidance?: string | null
          id?: string
          is_active?: boolean
          item_code?: string
          risk_level?: string
          sdf_only?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "framework_requirements_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "framework_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      framework_special_flags: {
        Row: {
          created_at: string
          display_order: number
          flag_hint: string | null
          flag_key: string
          flag_label: string
          framework_id: string
          id: string
          is_active: boolean
          triggers_domain: string | null
          triggers_requirement: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          flag_hint?: string | null
          flag_key: string
          flag_label: string
          framework_id: string
          id?: string
          is_active?: boolean
          triggers_domain?: string | null
          triggers_requirement?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          flag_hint?: string | null
          flag_key?: string
          flag_label?: string
          framework_id?: string
          id?: string
          is_active?: boolean
          triggers_domain?: string | null
          triggers_requirement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "framework_special_flags_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "assessment_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      grievances: {
        Row: {
          acknowledged_at: string | null
          assigned_to: string | null
          communication_log: Json | null
          description: string | null
          evidence_path: string | null
          id: string
          internal_notes: string | null
          nature: string
          resolution_summary: string | null
          resolved_at: string | null
          sla_deadline_ack: string
          sla_deadline_resolution: string
          status: string
          subject: string
          submitted_at: string
          updated_at: string
          user_email: string
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          assigned_to?: string | null
          communication_log?: Json | null
          description?: string | null
          evidence_path?: string | null
          id?: string
          internal_notes?: string | null
          nature: string
          resolution_summary?: string | null
          resolved_at?: string | null
          sla_deadline_ack?: string
          sla_deadline_resolution?: string
          status?: string
          subject: string
          submitted_at?: string
          updated_at?: string
          user_email: string
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          assigned_to?: string | null
          communication_log?: Json | null
          description?: string | null
          evidence_path?: string | null
          id?: string
          internal_notes?: string | null
          nature?: string
          resolution_summary?: string | null
          resolved_at?: string | null
          sla_deadline_ack?: string
          sla_deadline_resolution?: string
          status?: string
          subject?: string
          submitted_at?: string
          updated_at?: string
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      km_artefact_index: {
        Row: {
          content: string
          content_embedding: string | null
          created_at: string | null
          doc_type: string
          effective_date: string | null
          frameworks: string[] | null
          id: string
          industry_verticals: string[] | null
          is_active: boolean | null
          jurisdictions: string[] | null
          source_authority: string | null
          source_url: string | null
          sub_sectors: string[] | null
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          content: string
          content_embedding?: string | null
          created_at?: string | null
          doc_type: string
          effective_date?: string | null
          frameworks?: string[] | null
          id?: string
          industry_verticals?: string[] | null
          is_active?: boolean | null
          jurisdictions?: string[] | null
          source_authority?: string | null
          source_url?: string | null
          sub_sectors?: string[] | null
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          content?: string
          content_embedding?: string | null
          created_at?: string | null
          doc_type?: string
          effective_date?: string | null
          frameworks?: string[] | null
          id?: string
          industry_verticals?: string[] | null
          is_active?: boolean | null
          jurisdictions?: string[] | null
          source_authority?: string | null
          source_url?: string | null
          sub_sectors?: string[] | null
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      km_query_log: {
        Row: {
          artefacts_used: string[] | null
          created_at: string | null
          generated_output_preview: string | null
          id: string
          industries: string[] | null
          query_type: string | null
          sources_used: string[] | null
          sub_sector: string | null
          user_id: string | null
        }
        Insert: {
          artefacts_used?: string[] | null
          created_at?: string | null
          generated_output_preview?: string | null
          id?: string
          industries?: string[] | null
          query_type?: string | null
          sources_used?: string[] | null
          sub_sector?: string | null
          user_id?: string | null
        }
        Update: {
          artefacts_used?: string[] | null
          created_at?: string | null
          generated_output_preview?: string | null
          id?: string
          industries?: string[] | null
          query_type?: string | null
          sources_used?: string[] | null
          sub_sector?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notice_translations: {
        Row: {
          content: string
          created_at: string
          id: string
          language: string
          notice_id: string
          translation_status: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          language?: string
          notice_id: string
          translation_status?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          language?: string
          notice_id?: string
          translation_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notice_translations_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "privacy_notices"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_audit_log: {
        Row: {
          action: string
          action_detail: string | null
          document_id: string
          id: string
          ip_address: string | null
          performed_at: string
          performed_by: string
          performed_by_name: string | null
          version_id: string | null
        }
        Insert: {
          action: string
          action_detail?: string | null
          document_id: string
          id?: string
          ip_address?: string | null
          performed_at?: string
          performed_by: string
          performed_by_name?: string | null
          version_id?: string | null
        }
        Update: {
          action?: string
          action_detail?: string | null
          document_id?: string
          id?: string
          ip_address?: string | null
          performed_at?: string
          performed_by?: string
          performed_by_name?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_audit_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "policy_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_audit_log_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "policy_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_builder_snapshots: {
        Row: {
          change_notes: string | null
          created_at: string | null
          document_type: string | null
          generated_content: string | null
          id: string
          is_active: boolean | null
          org_context: Json | null
          user_id: string
          version_number: number | null
        }
        Insert: {
          change_notes?: string | null
          created_at?: string | null
          document_type?: string | null
          generated_content?: string | null
          id?: string
          is_active?: boolean | null
          org_context?: Json | null
          user_id: string
          version_number?: number | null
        }
        Update: {
          change_notes?: string | null
          created_at?: string | null
          document_type?: string | null
          generated_content?: string | null
          id?: string
          is_active?: boolean | null
          org_context?: Json | null
          user_id?: string
          version_number?: number | null
        }
        Relationships: []
      }
      policy_documents: {
        Row: {
          approver_name: string | null
          classification: string
          created_at: string
          current_version: string
          document_ref: string
          document_type: string
          effective_date: string | null
          id: string
          industry_vertical: string | null
          maturity_level: number | null
          org_size: string | null
          owner_name: string | null
          review_date: string | null
          selected_frameworks: string[] | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approver_name?: string | null
          classification?: string
          created_at?: string
          current_version?: string
          document_ref: string
          document_type?: string
          effective_date?: string | null
          id?: string
          industry_vertical?: string | null
          maturity_level?: number | null
          org_size?: string | null
          owner_name?: string | null
          review_date?: string | null
          selected_frameworks?: string[] | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approver_name?: string | null
          classification?: string
          created_at?: string
          current_version?: string
          document_ref?: string
          document_type?: string
          effective_date?: string | null
          id?: string
          industry_vertical?: string | null
          maturity_level?: number | null
          org_size?: string | null
          owner_name?: string | null
          review_date?: string | null
          selected_frameworks?: string[] | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      policy_items: {
        Row: {
          approved: string | null
          assessment_id: string
          framework_id: string | null
          id: string
          item_id: string
          last_reviewed: string | null
          observation: string | null
          review_cycle: string | null
          status: string | null
        }
        Insert: {
          approved?: string | null
          assessment_id: string
          framework_id?: string | null
          id?: string
          item_id: string
          last_reviewed?: string | null
          observation?: string | null
          review_cycle?: string | null
          status?: string | null
        }
        Update: {
          approved?: string | null
          assessment_id?: string
          framework_id?: string | null
          id?: string
          item_id?: string
          last_reviewed?: string | null
          observation?: string | null
          review_cycle?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_items_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_items_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "assessment_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_versions: {
        Row: {
          ai_model: string | null
          change_summary: string | null
          content: string
          created_at: string
          created_by: string
          document_id: string
          generated_by: string
          id: string
          is_current: boolean
          version: string
        }
        Insert: {
          ai_model?: string | null
          change_summary?: string | null
          content: string
          created_at?: string
          created_by: string
          document_id: string
          generated_by?: string
          id?: string
          is_current?: boolean
          version?: string
        }
        Update: {
          ai_model?: string | null
          change_summary?: string | null
          content?: string
          created_at?: string
          created_by?: string
          document_id?: string
          generated_by?: string
          id?: string
          is_current?: boolean
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "policy_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_notices: {
        Row: {
          created_at: string
          created_by: string | null
          cross_border_transfers: string | null
          data_categories: Json | null
          dpb_complaint_route: string | null
          effective_date: string | null
          fiduciary_contact: string | null
          fiduciary_name: string | null
          grievance_officer_designation: string | null
          grievance_officer_email: string | null
          grievance_officer_name: string | null
          grievance_response_timeline: string | null
          id: string
          material_change: boolean | null
          modified_by: string | null
          purposes: Json | null
          retention_periods: Json | null
          rights_description: string | null
          status: string
          third_parties: Json | null
          updated_at: string
          version_number: string
          withdraw_consent_link: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cross_border_transfers?: string | null
          data_categories?: Json | null
          dpb_complaint_route?: string | null
          effective_date?: string | null
          fiduciary_contact?: string | null
          fiduciary_name?: string | null
          grievance_officer_designation?: string | null
          grievance_officer_email?: string | null
          grievance_officer_name?: string | null
          grievance_response_timeline?: string | null
          id?: string
          material_change?: boolean | null
          modified_by?: string | null
          purposes?: Json | null
          retention_periods?: Json | null
          rights_description?: string | null
          status?: string
          third_parties?: Json | null
          updated_at?: string
          version_number?: string
          withdraw_consent_link?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cross_border_transfers?: string | null
          data_categories?: Json | null
          dpb_complaint_route?: string | null
          effective_date?: string | null
          fiduciary_contact?: string | null
          fiduciary_name?: string | null
          grievance_officer_designation?: string | null
          grievance_officer_email?: string | null
          grievance_officer_name?: string | null
          grievance_response_timeline?: string | null
          id?: string
          material_change?: boolean | null
          modified_by?: string | null
          purposes?: Json | null
          retention_periods?: Json | null
          rights_description?: string | null
          status?: string
          third_parties?: Json | null
          updated_at?: string
          version_number?: string
          withdraw_consent_link?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          job_title: string | null
          last_login: string | null
          organisation: string | null
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          job_title?: string | null
          last_login?: string | null
          organisation?: string | null
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_login?: string | null
          organisation?: string | null
          role?: string | null
        }
        Relationships: []
      }
      regulatory_source_map: {
        Row: {
          authority: string
          description: string | null
          framework: string
          id: string
          industry_vertical: string
          is_active: boolean | null
          jurisdiction: string
          last_checked: string | null
          source_url: string
        }
        Insert: {
          authority: string
          description?: string | null
          framework: string
          id?: string
          industry_vertical: string
          is_active?: boolean | null
          jurisdiction: string
          last_checked?: string | null
          source_url: string
        }
        Update: {
          authority?: string
          description?: string | null
          framework?: string
          id?: string
          industry_vertical?: string
          is_active?: boolean | null
          jurisdiction?: string
          last_checked?: string | null
          source_url?: string
        }
        Relationships: []
      }
      rights_requests: {
        Row: {
          assigned_to: string | null
          communication_log: Json | null
          completed_at: string | null
          description: string | null
          id: string
          internal_notes: string | null
          rejection_reason: string | null
          request_type: string
          resolution_summary: string | null
          sla_deadline: string
          status: string
          submitted_at: string
          supporting_doc_path: string | null
          updated_at: string
          user_email: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          communication_log?: Json | null
          completed_at?: string | null
          description?: string | null
          id?: string
          internal_notes?: string | null
          rejection_reason?: string | null
          request_type: string
          resolution_summary?: string | null
          sla_deadline?: string
          status?: string
          submitted_at?: string
          supporting_doc_path?: string | null
          updated_at?: string
          user_email: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          communication_log?: Json | null
          completed_at?: string | null
          description?: string | null
          id?: string
          internal_notes?: string | null
          rejection_reason?: string | null
          request_type?: string
          resolution_summary?: string | null
          sla_deadline?: string
          status?: string
          submitted_at?: string
          supporting_doc_path?: string | null
          updated_at?: string
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      shared_reports: {
        Row: {
          assessment_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          share_code: string
          shared_at: string
          shared_by: string | null
        }
        Insert: {
          assessment_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          share_code: string
          shared_at?: string
          shared_by?: string | null
        }
        Update: {
          assessment_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          share_code?: string
          shared_at?: string
          shared_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_reports_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_km_artefacts: {
        Args: {
          filter_industries?: string[]
          filter_jurisdictions?: string[]
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          doc_type: string
          frameworks: string[]
          id: string
          industry_verticals: string[]
          similarity: number
          source_authority: string
          source_url: string
          title: string
          version: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "auditor"
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
      app_role: ["admin", "moderator", "user", "auditor"],
    },
  },
} as const
