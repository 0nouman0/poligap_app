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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_conversations: {
        Row: {
          agent_id: string | null
          chat_name: string
          company_id: string | null
          created_at: string | null
          id: string
          status: string | null
          summary: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          chat_name: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          summary?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          chat_name?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          summary?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about: string | null
          banner: Json | null
          company_name: string | null
          country: string | null
          created_at: string | null
          created_by: Json | null
          designation: string | null
          dob: string | null
          email: string
          id: string
          member_status: string | null
          mobile: string | null
          name: string
          profile_created_on: string | null
          profile_image: string | null
          reporting_manager: Json | null
          role: string | null
          status: string | null
          unique_id: string
          updated_at: string | null
        }
        Insert: {
          about?: string | null
          banner?: Json | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: Json | null
          designation?: string | null
          dob?: string | null
          email: string
          id: string
          member_status?: string | null
          mobile?: string | null
          name: string
          profile_created_on?: string | null
          profile_image?: string | null
          reporting_manager?: Json | null
          role?: string | null
          status?: string | null
          unique_id: string
          updated_at?: string | null
        }
        Update: {
          about?: string | null
          banner?: Json | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: Json | null
          designation?: string | null
          dob?: string | null
          email?: string
          id?: string
          member_status?: string | null
          mobile?: string | null
          name?: string
          profile_created_on?: string | null
          profile_image?: string | null
          reporting_manager?: Json | null
          role?: string | null
          status?: string | null
          unique_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rulebase: {
        Row: {
          active: boolean | null
          company_id: string | null
          created_at: string | null
          description: string | null
          file_content: string | null
          file_name: string | null
          id: string
          name: string
          source_type: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          file_content?: string | null
          file_name?: string | null
          id?: string
          name: string
          source_type?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          file_content?: string | null
          file_name?: string | null
          id?: string
          name?: string
          source_type?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rulebase_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rulebase_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee: string | null
          category: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          source: string | null
          source_ref: Json | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assignee?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          source?: string | null
          source_ref?: Json | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assignee?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          source?: string | null
          source_ref?: Json | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
