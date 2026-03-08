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
      artefact_files: {
        Row: {
          description: string | null
          file_name: string
          file_path: string
          folder: string
          id: string
          uploaded_at: string
        }
        Insert: {
          description?: string | null
          file_name: string
          file_path: string
          folder: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          description?: string | null
          file_name?: string
          file_path?: string
          folder?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      assessment_checks: {
        Row: {
          assessment_id: string
          check_id: string
          domain: string
          evidence_status: string | null
          id: string
          observation: string | null
          owner: string | null
          priority: string | null
          status: string | null
        }
        Insert: {
          assessment_id: string
          check_id: string
          domain: string
          evidence_status?: string | null
          id?: string
          observation?: string | null
          owner?: string | null
          priority?: string | null
          status?: string | null
        }
        Update: {
          assessment_id?: string
          check_id?: string
          domain?: string
          evidence_status?: string | null
          id?: string
          observation?: string | null
          owner?: string | null
          priority?: string | null
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
        ]
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
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
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
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
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
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
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
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          organisation: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          organisation?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          organisation?: string | null
          role?: string | null
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
