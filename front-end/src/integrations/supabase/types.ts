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
      charger_types: {
        Row: {
          icon_url: string | null
          max_supported_power: number | null
          name: string | null
          type_id: number
        }
        Insert: {
          icon_url?: string | null
          max_supported_power?: number | null
          name?: string | null
          type_id?: number
        }
        Update: {
          icon_url?: string | null
          max_supported_power?: number | null
          name?: string | null
          type_id?: number
        }
        Relationships: []
      }
      chargers: {
        Row: {
          charger_id: number
          max_power_kw: number | null
          station_id: number | null
          status: Database["public"]["Enums"]["charger_status"] | null
          type_id: number | null
        }
        Insert: {
          charger_id?: number
          max_power_kw?: number | null
          station_id?: number | null
          status?: Database["public"]["Enums"]["charger_status"] | null
          type_id?: number | null
        }
        Update: {
          charger_id?: number
          max_power_kw?: number | null
          station_id?: number | null
          status?: Database["public"]["Enums"]["charger_status"] | null
          type_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chargers_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["station_id"]
          },
          {
            foreignKeyName: "chargers_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "charger_types"
            referencedColumns: ["type_id"]
          },
        ]
      }
      charging_sessions: {
        Row: {
          card_id: number | null
          charger_id: number | null
          created_at: string | null
          end_time: string | null
          session_id: number
          start_time: string
          total_cost: number | null
          total_kwh: number | null
          user_id: string
        }
        Insert: {
          card_id?: number | null
          charger_id?: number | null
          created_at?: string | null
          end_time?: string | null
          session_id?: number
          start_time: string
          total_cost?: number | null
          total_kwh?: number | null
          user_id: string
        }
        Update: {
          card_id?: number | null
          charger_id?: number | null
          created_at?: string | null
          end_time?: string | null
          session_id?: number
          start_time?: string
          total_cost?: number | null
          total_kwh?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "charging_sessions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "saved_cards"
            referencedColumns: ["card_id"]
          },
          {
            foreignKeyName: "charging_sessions_charger_id_fkey"
            columns: ["charger_id"]
            isOneToOne: false
            referencedRelation: "chargers"
            referencedColumns: ["charger_id"]
          },
          {
            foreignKeyName: "charging_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      counties: {
        Row: {
          name: string
          region_name: string | null
        }
        Insert: {
          name: string
          region_name?: string | null
        }
        Update: {
          name?: string
          region_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counties_region_name_fkey"
            columns: ["region_name"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["name"]
          },
        ]
      }
      locations: {
        Row: {
          access: number | null
          address: string | null
          available_station_count: number | null
          charger_types: string[] | null
          coming_soon: boolean | null
          county_name: string | null
          icon: string | null
          icon_type: string | null
          in_use_station_count: number | null
          is_active: boolean | null
          is_fast_charger: boolean | null
          latitude: number
          location_id: number
          longitude: number
          map_card_logo_url: string | null
          name: string | null
          score: number | null
          station_count: number | null
          under_repair: boolean | null
          url: string | null
        }
        Insert: {
          access?: number | null
          address?: string | null
          available_station_count?: number | null
          charger_types?: string[] | null
          coming_soon?: boolean | null
          county_name?: string | null
          icon?: string | null
          icon_type?: string | null
          in_use_station_count?: number | null
          is_active?: boolean | null
          is_fast_charger?: boolean | null
          latitude: number
          location_id?: number
          longitude: number
          map_card_logo_url?: string | null
          name?: string | null
          score?: number | null
          station_count?: number | null
          under_repair?: boolean | null
          url?: string | null
        }
        Update: {
          access?: number | null
          address?: string | null
          available_station_count?: number | null
          charger_types?: string[] | null
          coming_soon?: boolean | null
          county_name?: string | null
          icon?: string | null
          icon_type?: string | null
          in_use_station_count?: number | null
          is_active?: boolean | null
          is_fast_charger?: boolean | null
          latitude?: number
          location_id?: number
          longitude?: number
          map_card_logo_url?: string | null
          name?: string | null
          score?: number | null
          station_count?: number | null
          under_repair?: boolean | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_county_name_fkey"
            columns: ["county_name"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["name"]
          },
        ]
      }
      payment_methods: {
        Row: {
          method_name: string
        }
        Insert: {
          method_name: string
        }
        Update: {
          method_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      regions: {
        Row: {
          name: string
        }
        Insert: {
          name: string
        }
        Update: {
          name?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          charger_id: number
          created_at: string | null
          duration_minutes: number | null
          reservation_id: number
          start_time: string
          user_id: string
        }
        Insert: {
          charger_id: number
          created_at?: string | null
          duration_minutes?: number | null
          reservation_id?: number
          start_time: string
          user_id: string
        }
        Update: {
          charger_id?: number
          created_at?: string | null
          duration_minutes?: number | null
          reservation_id?: number
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_charger_id_fkey"
            columns: ["charger_id"]
            isOneToOne: false
            referencedRelation: "chargers"
            referencedColumns: ["charger_id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_cards: {
        Row: {
          card_id: number
          last_4_digits: string | null
          method_name: string | null
          token: string | null
          user_id: string
        }
        Insert: {
          card_id?: number
          last_4_digits?: string | null
          method_name?: string | null
          token?: string | null
          user_id: string
        }
        Update: {
          card_id?: number
          last_4_digits?: string | null
          method_name?: string | null
          token?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_cards_method_name_fkey"
            columns: ["method_name"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["method_name"]
          },
          {
            foreignKeyName: "saved_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          location_id: number | null
          network_id: number | null
          physical_id: string | null
          station_id: number
        }
        Insert: {
          location_id?: number | null
          network_id?: number | null
          physical_id?: string | null
          station_id?: number
        }
        Update: {
          location_id?: number | null
          network_id?: number | null
          physical_id?: string | null
          station_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "stations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["location_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      app_role: "admin" | "user"
      charger_status:
        | "AVAILABLE"
        | "OCCUPIED"
        | "RESERVED"
        | "FAULTED"
        | "OFFLINE"
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
      app_role: ["admin", "user"],
      charger_status: [
        "AVAILABLE",
        "OCCUPIED",
        "RESERVED",
        "FAULTED",
        "OFFLINE",
      ],
    },
  },
} as const
