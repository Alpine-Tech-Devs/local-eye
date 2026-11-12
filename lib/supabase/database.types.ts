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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          anon_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id: string
          payload: Json
        }
        Insert: {
          anon_id: string
          created_at?: string
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id?: string
          payload?: Json
        }
        Update: {
          anon_id?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["analytics_event_type"]
          id?: string
          payload?: Json
        }
        Relationships: []
      }
      events: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["event_category"]
          city: string
          created_at: string
          description: string | null
          end_datetime: string | null
          external_id: string | null
          id: string
          image_url: string | null
          indoor_outdoor: Database["public"]["Enums"]["indoor_outdoor"]
          is_free: boolean
          last_verified_at: string | null
          latitude: number
          longitude: number
          max_age: number | null
          min_age: number | null
          price_max: number | null
          price_min: number | null
          recurrence_date: string | null
          recurring_series_id: string | null
          registration_required: boolean
          registration_url: string | null
          source_id: string | null
          source_name: string
          source_url: string
          start_datetime: string
          state: string
          status: string
          title: string
          updated_at: string
          venue_name: string
        }
        Insert: {
          address?: string | null
          category: Database["public"]["Enums"]["event_category"]
          city: string
          created_at?: string
          description?: string | null
          end_datetime?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          indoor_outdoor?: Database["public"]["Enums"]["indoor_outdoor"]
          is_free?: boolean
          last_verified_at?: string | null
          latitude: number
          longitude: number
          max_age?: number | null
          min_age?: number | null
          price_max?: number | null
          price_min?: number | null
          recurrence_date?: string | null
          recurring_series_id?: string | null
          registration_required?: boolean
          registration_url?: string | null
          source_id?: string | null
          source_name: string
          source_url: string
          start_datetime: string
          state: string
          status?: string
          title: string
          updated_at?: string
          venue_name: string
        }
        Update: {
          address?: string | null
          category?: Database["public"]["Enums"]["event_category"]
          city?: string
          created_at?: string
          description?: string | null
          end_datetime?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          indoor_outdoor?: Database["public"]["Enums"]["indoor_outdoor"]
          is_free?: boolean
          last_verified_at?: string | null
          latitude?: number
          longitude?: number
          max_age?: number | null
          min_age?: number | null
          price_max?: number | null
          price_min?: number | null
          recurrence_date?: string | null
          recurring_series_id?: string | null
          registration_required?: boolean
          registration_url?: string | null
          source_id?: string | null
          source_name?: string
          source_url?: string
          start_datetime?: string
          state?: string
          status?: string
          title?: string
          updated_at?: string
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_recurring_series_id_fkey"
            columns: ["recurring_series_id"]
            isOneToOne: false
            referencedRelation: "recurring_event_series"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_event_exceptions: {
        Row: {
          created_at: string
          occurrence_date: string
          reason: string | null
          series_id: string
        }
        Insert: {
          created_at?: string
          occurrence_date: string
          reason?: string | null
          series_id: string
        }
        Update: {
          created_at?: string
          occurrence_date?: string
          reason?: string | null
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_event_exceptions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "recurring_event_series"
            referencedColumns: ["id"]
          },
        ]
      }
      rice_public_library_occurrence_source_links: {
        Row: {
          created_at: string
          occurrence_date: string
          series_id: string
          source_url: string
        }
        Insert: {
          created_at?: string
          occurrence_date: string
          series_id: string
          source_url: string
        }
        Update: {
          created_at?: string
          occurrence_date?: string
          series_id?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "rice_public_library_occurrence_source_links_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "recurring_event_series"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_event_series: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["event_category"]
          city: string
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          description: string | null
          duration_minutes: number
          end_date: string | null
          id: string
          image_url: string | null
          indoor_outdoor: Database["public"]["Enums"]["indoor_outdoor"]
          is_active: boolean
          is_free: boolean
          latitude: number
          longitude: number
          max_age: number | null
          min_age: number | null
          price_max: number | null
          price_min: number | null
          recurrence_frequency: "weekly" | "monthly"
          registration_required: boolean
          registration_url: string | null
          source_id: string | null
          external_id: string | null
          source_name: string
          source_url: string
          start_date: string
          start_time: string
          state: string
          time_zone: string
          title: string
          updated_at: string
          venue_name: string
        }
        Insert: {
          address?: string | null
          category: Database["public"]["Enums"]["event_category"]
          city: string
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          duration_minutes: number
          end_date?: string | null
          id?: string
          image_url?: string | null
          indoor_outdoor?: Database["public"]["Enums"]["indoor_outdoor"]
          is_active?: boolean
          is_free?: boolean
          latitude: number
          longitude: number
          max_age?: number | null
          min_age?: number | null
          price_max?: number | null
          price_min?: number | null
          recurrence_frequency: "weekly" | "monthly"
          registration_required?: boolean
          registration_url?: string | null
          source_id?: string | null
          external_id?: string | null
          source_name: string
          source_url: string
          start_date: string
          start_time: string
          state: string
          time_zone?: string
          title: string
          updated_at?: string
          venue_name: string
        }
        Update: {
          address?: string | null
          category?: Database["public"]["Enums"]["event_category"]
          city?: string
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          duration_minutes?: number
          end_date?: string | null
          id?: string
          image_url?: string | null
          indoor_outdoor?: Database["public"]["Enums"]["indoor_outdoor"]
          is_active?: boolean
          is_free?: boolean
          latitude?: number
          longitude?: number
          max_age?: number | null
          min_age?: number | null
          price_max?: number | null
          price_min?: number | null
          recurrence_frequency?: "weekly" | "monthly"
          registration_required?: boolean
          registration_url?: string | null
          source_id?: string | null
          external_id?: string | null
          source_name?: string
          source_url?: string
          start_date?: string
          start_time?: string
          state?: string
          time_zone?: string
          title?: string
          updated_at?: string
          venue_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_recurring_event_occurrences: {
        Args: { p_days_ahead?: number }
        Returns: number
      }
      sync_south_berwick_littles_storytime: {
        Args: { p_exceptions: Json; p_series: Json }
        Returns: number
      }
    }
    Enums: {
      analytics_event_type:
        | "search"
        | "result_click"
        | "source_click"
        | "registration_click"
        | "save"
        | "unsave"
        | "session_start"
      event_category:
        | "Storytime"
        | "Museum"
        | "Playground"
        | "Festival"
        | "Farm"
        | "Nature"
        | "Arts & Crafts"
        | "Music"
        | "Sports"
        | "Open Gym"
        | "Educational"
        | "Seasonal"
        | "Community Event"
        | "Other"
      indoor_outdoor: "indoor" | "outdoor" | "either"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      analytics_event_type: [
        "search",
        "result_click",
        "source_click",
        "registration_click",
        "save",
        "unsave",
        "session_start",
      ],
      event_category: [
        "Storytime",
        "Museum",
        "Playground",
        "Festival",
        "Farm",
        "Nature",
        "Arts & Crafts",
        "Music",
        "Sports",
        "Open Gym",
        "Educational",
        "Seasonal",
        "Community Event",
        "Other",
      ],
      indoor_outdoor: ["indoor", "outdoor", "either"],
    },
  },
} as const
