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
      daily_log_meals: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string
          daily_log_id: string
          fat_g: number | null
          fiber_g: number | null
          id: string
          meal_id: string | null
          meal_name: string | null
          meal_time: string
          protein_g: number | null
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          daily_log_id: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          meal_id?: string | null
          meal_name?: string | null
          meal_time: string
          protein_g?: number | null
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          daily_log_id?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          meal_id?: string | null
          meal_name?: string | null
          meal_time?: string
          protein_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_meals_daily_log_id_fkey"
            columns: ["daily_log_id"]
            isOneToOne: false
            referencedRelation: "daily_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_log_meals_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          id: string
          log_date: string
          notes: string | null
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_fiber_g: number | null
          total_protein_g: number | null
          user_id: string
          water_consumed_ml: number | null
        }
        Insert: {
          id?: string
          log_date: string
          notes?: string | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          user_id: string
          water_consumed_ml?: number | null
        }
        Update: {
          id?: string
          log_date?: string
          notes?: string | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          user_id?: string
          water_consumed_ml?: number | null
        }
        Relationships: []
      }
      foods: {
        Row: {
          calcium_mg: number | null
          calories_per_serving: number
          carbs_g: number
          category: string
          created_at: string
          fat_g: number
          fiber_g: number
          id: string
          iron_mg: number | null
          is_halal: boolean | null
          magnesium_mg: number | null
          name: string
          notes: string | null
          protein_g: number
          serving_size_g: number
          serving_unit: string
          zinc_mg: number | null
        }
        Insert: {
          calcium_mg?: number | null
          calories_per_serving?: number
          carbs_g?: number
          category: string
          created_at?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          iron_mg?: number | null
          is_halal?: boolean | null
          magnesium_mg?: number | null
          name: string
          notes?: string | null
          protein_g?: number
          serving_size_g?: number
          serving_unit?: string
          zinc_mg?: number | null
        }
        Update: {
          calcium_mg?: number | null
          calories_per_serving?: number
          carbs_g?: number
          category?: string
          created_at?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          iron_mg?: number | null
          is_halal?: boolean | null
          magnesium_mg?: number | null
          name?: string
          notes?: string | null
          protein_g?: number
          serving_size_g?: number
          serving_unit?: string
          zinc_mg?: number | null
        }
        Relationships: []
      }
      meal_items: {
        Row: {
          calories: number | null
          carbs_g: number | null
          fat_g: number | null
          fiber_g: number | null
          food_id: string | null
          food_name: string | null
          id: string
          meal_id: string
          protein_g: number | null
          quantity_g: number
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          food_id?: string | null
          food_name?: string | null
          id?: string
          meal_id: string
          protein_g?: number | null
          quantity_g: number
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          food_id?: string | null
          food_name?: string | null
          id?: string
          meal_id?: string
          protein_g?: number | null
          quantity_g?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          source_url: string | null
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_fiber_g: number | null
          total_protein_g: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          source_url?: string | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          source_url?: string | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          body_fat_percent: number | null
          created_at: string
          current_weight_kg: number | null
          daily_calorie_target: number | null
          daily_carbs_target_g: number | null
          daily_fat_target_g: number | null
          daily_fiber_target_g: number | null
          daily_protein_target_g: number | null
          daily_water_target_ml: number | null
          email: string | null
          full_name: string | null
          gender: string | null
          goal: string | null
          height_cm: number | null
          id: string
          target_body_fat_percent: number | null
          target_weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          body_fat_percent?: number | null
          created_at?: string
          current_weight_kg?: number | null
          daily_calorie_target?: number | null
          daily_carbs_target_g?: number | null
          daily_fat_target_g?: number | null
          daily_fiber_target_g?: number | null
          daily_protein_target_g?: number | null
          daily_water_target_ml?: number | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          id: string
          target_body_fat_percent?: number | null
          target_weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          body_fat_percent?: number | null
          created_at?: string
          current_weight_kg?: number | null
          daily_calorie_target?: number | null
          daily_carbs_target_g?: number | null
          daily_fat_target_g?: number | null
          daily_fiber_target_g?: number | null
          daily_protein_target_g?: number | null
          daily_water_target_ml?: number | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          id?: string
          target_body_fat_percent?: number | null
          target_weight_kg?: number | null
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          id: string
          log_date: string
          logged_at: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          id?: string
          log_date: string
          logged_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          id?: string
          log_date?: string
          logged_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          id: string
          logged_at: string
          notes: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          logged_at: string
          notes?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          logged_at?: string
          notes?: string | null
          user_id?: string
          weight_kg?: number
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
