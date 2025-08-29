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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      practice_sessions: {
        Row: {
          created_at: string | null
          current_question_index: number | null
          difficulty: string | null
          end_time: string | null
          id: string
          percentage_correct: number | null
          practice_set_id: string | null
          questions_order: string[] | null
          score: number | null
          session_type: string
          start_time: string | null
          status: string | null
          subject: string | null
          test_type: string | null
          topic: string | null
          total_questions: number
          total_time_spent: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_question_index?: number | null
          difficulty?: string | null
          end_time?: string | null
          id?: string
          percentage_correct?: number | null
          practice_set_id?: string | null
          questions_order?: string[] | null
          score?: number | null
          session_type: string
          start_time?: string | null
          status?: string | null
          subject?: string | null
          test_type?: string | null
          topic?: string | null
          total_questions: number
          total_time_spent?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_question_index?: number | null
          difficulty?: string | null
          end_time?: string | null
          id?: string
          percentage_correct?: number | null
          practice_set_id?: string | null
          questions_order?: string[] | null
          score?: number | null
          session_type?: string
          start_time?: string | null
          status?: string | null
          subject?: string | null
          test_type?: string | null
          topic?: string | null
          total_questions?: number
          total_time_spent?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_practice_set_id_fkey"
            columns: ["practice_set_id"]
            isOneToOne: false
            referencedRelation: "practice_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sets: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty_mix: Json | null
          id: string
          is_randomized: boolean | null
          name: string
          set_type: string
          subjects_included: string[] | null
          test_type: string
          time_limit: number | null
          topics_included: string[] | null
          total_questions: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty_mix?: Json | null
          id?: string
          is_randomized?: boolean | null
          name: string
          set_type: string
          subjects_included?: string[] | null
          test_type: string
          time_limit?: number | null
          topics_included?: string[] | null
          total_questions: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty_mix?: Json | null
          id?: string
          is_randomized?: boolean | null
          name?: string
          set_type?: string
          subjects_included?: string[] | null
          test_type?: string
          time_limit?: number | null
          topics_included?: string[] | null
          total_questions?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          difficulty_level: string
          explanation: string
          id: string
          is_active: boolean | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_images: string[] | null
          question_text: string
          sub_topic: string | null
          subject: string
          test_type: string
          time_allocated: number | null
          topic: string
          updated_at: string | null
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          difficulty_level: string
          explanation: string
          id?: string
          is_active?: boolean | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_images?: string[] | null
          question_text: string
          sub_topic?: string | null
          subject: string
          test_type: string
          time_allocated?: number | null
          topic: string
          updated_at?: string | null
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          difficulty_level?: string
          explanation?: string
          id?: string
          is_active?: boolean | null
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_images?: string[] | null
          question_text?: string
          sub_topic?: string | null
          subject?: string
          test_type?: string
          time_allocated?: number | null
          topic?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_tier: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_tier: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_tier?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          accuracy_percentage: number | null
          avg_time_per_question: number | null
          best_score: number | null
          id: string
          last_practiced: string | null
          mastery_level: string | null
          sessions_completed: number | null
          subject: string | null
          test_type: string | null
          topic: string | null
          total_attempted: number | null
          total_correct: number | null
          total_time_spent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accuracy_percentage?: number | null
          avg_time_per_question?: number | null
          best_score?: number | null
          id?: string
          last_practiced?: string | null
          mastery_level?: string | null
          sessions_completed?: number | null
          subject?: string | null
          test_type?: string | null
          topic?: string | null
          total_attempted?: number | null
          total_correct?: number | null
          total_time_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accuracy_percentage?: number | null
          avg_time_per_question?: number | null
          best_score?: number | null
          id?: string
          last_practiced?: string | null
          mastery_level?: string | null
          sessions_completed?: number | null
          subject?: string | null
          test_type?: string | null
          topic?: string | null
          total_attempted?: number | null
          total_correct?: number | null
          total_time_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_answers: {
        Row: {
          answered_at: string | null
          confidence_level: string | null
          id: string
          is_correct: boolean | null
          is_flagged: boolean | null
          question_id: string | null
          session_id: string | null
          time_spent: number
          user_answer: string | null
        }
        Insert: {
          answered_at?: string | null
          confidence_level?: string | null
          id?: string
          is_correct?: boolean | null
          is_flagged?: boolean | null
          question_id?: string | null
          session_id?: string | null
          time_spent: number
          user_answer?: string | null
        }
        Update: {
          answered_at?: string | null
          confidence_level?: string | null
          id?: string
          is_correct?: boolean | null
          is_flagged?: boolean | null
          question_id?: string | null
          session_id?: string | null
          time_spent?: number
          user_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          first_name: string | null
          grade_level: number | null
          id: string
          last_name: string | null
          selected_test: string | null
          study_streak: number | null
          subscription_expires_at: string | null
          subscription_tier: string | null
          total_study_time: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          grade_level?: number | null
          id: string
          last_name?: string | null
          selected_test?: string | null
          study_streak?: number | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          total_study_time?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          grade_level?: number | null
          id?: string
          last_name?: string | null
          selected_test?: string | null
          study_streak?: number | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          total_study_time?: number | null
          updated_at?: string | null
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
      update_user_analytics: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: undefined
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
