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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          answer: string
          created_at: string
          id: string
          material_id: string | null
          question: string
          reviewed_at: string | null
          status: string | null
          subject_id: string | null
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          material_id?: string | null
          question: string
          reviewed_at?: string | null
          status?: string | null
          subject_id?: string | null
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          material_id?: string | null
          question?: string
          reviewed_at?: string | null
          status?: string | null
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          subject_id: string
          target_quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          subject_id: string
          target_quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          subject_id?: string
          target_quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string
          extracted_text: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string | null
          page_count: number | null
          subject_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          mime_type?: string | null
          page_count?: number | null
          subject_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string | null
          page_count?: number | null
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          kind: string
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      periods: {
        Row: {
          created_at: string
          id: string
          name: string
          number: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          number: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          number?: number
        }
        Relationships: []
      }
      procedure_records: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          notes: string | null
          performed_on: string
          quantity: number
          subject_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          notes?: string | null
          performed_on?: string
          quantity?: number
          subject_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          notes?: string | null
          performed_on?: string
          quantity?: number
          subject_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_records_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_records_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          course: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          institution: string | null
          last_seen_at: string
          period_number: number
          updated_at: string
        }
        Insert: {
          course?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          institution?: string | null
          last_seen_at?: string
          period_number?: number
          updated_at?: string
        }
        Update: {
          course?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          institution?: string | null
          last_seen_at?: string
          period_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      progress_snapshots: {
        Row: {
          created_at: string
          id: string
          percent: number
          snapshot_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          percent?: number
          snapshot_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          percent?: number
          snapshot_date?: string
          user_id?: string
        }
        Relationships: []
      }
      simulation_answers: {
        Row: {
          answer: string | null
          created_at: string
          explanation: string | null
          id: string
          is_correct: boolean | null
          question_id: string
          review_topic: string | null
          score: number | null
          simulation_id: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          is_correct?: boolean | null
          question_id: string
          review_topic?: string | null
          score?: number | null
          simulation_id: string
          user_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string
          review_topic?: string | null
          score?: number | null
          simulation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "simulation_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_answers_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_questions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          options: Json | null
          position: number
          question_type: string
          simulation_id: string
          statement: string
          topic: string | null
          user_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          options?: Json | null
          position?: number
          question_type?: string
          simulation_id: string
          statement: string
          topic?: string | null
          user_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          options?: Json | null
          position?: number
          question_type?: string
          simulation_id?: string
          statement?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_questions_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          correct_count: number
          created_at: string
          difficulty: string
          duration_seconds: number | null
          exam_type: string
          finished_at: string | null
          focus_topics: string | null
          id: string
          material_ids: Json
          question_count: number
          score: number | null
          status: string
          subject_id: string | null
          time_limit_minutes: number | null
          title: string
          user_id: string
          wrong_count: number
        }
        Insert: {
          correct_count?: number
          created_at?: string
          difficulty?: string
          duration_seconds?: number | null
          exam_type?: string
          finished_at?: string | null
          focus_topics?: string | null
          id?: string
          material_ids?: Json
          question_count?: number
          score?: number | null
          status?: string
          subject_id?: string | null
          time_limit_minutes?: number | null
          title: string
          user_id: string
          wrong_count?: number
        }
        Update: {
          correct_count?: number
          created_at?: string
          difficulty?: string
          duration_seconds?: number | null
          exam_type?: string
          finished_at?: string | null
          focus_topics?: string | null
          id?: string
          material_ids?: Json
          question_count?: number
          score?: number | null
          status?: string
          subject_id?: string | null
          time_limit_minutes?: number | null
          title?: string
          user_id?: string
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulations_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      study_summaries: {
        Row: {
          content: string
          created_at: string
          id: string
          material_id: string | null
          material_ids: Json
          structured: Json | null
          subject_id: string | null
          summary_type: string
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          material_id?: string | null
          material_ids?: Json
          structured?: Json | null
          subject_id?: string | null
          summary_type?: string
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          material_id?: string | null
          material_ids?: Json
          structured?: Json | null
          subject_id?: string | null
          summary_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_summaries_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_summaries_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          id: string
          is_clinic_integrated: boolean
          name: string
          period_number: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_clinic_integrated?: boolean
          name: string
          period_number: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_clinic_integrated?: boolean
          name?: string
          period_number?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
