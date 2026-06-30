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
      negotiations: {
        Row: {
          created_at: string
          deadline: string | null
          id: string
          recommendation_type: string | null
          retention_call_status: string | null
          retention_offer_amount: number | null
          script_used: boolean
          started_at: string
          status: string
          user_id: string
          user_provider_id: string | null
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          id?: string
          recommendation_type?: string | null
          retention_call_status?: string | null
          retention_offer_amount?: number | null
          script_used?: boolean
          started_at?: string
          status?: string
          user_id: string
          user_provider_id?: string | null
        }
        Update: {
          created_at?: string
          deadline?: string | null
          id?: string
          recommendation_type?: string | null
          retention_call_status?: string | null
          retention_offer_amount?: number | null
          script_used?: boolean
          started_at?: string
          status?: string
          user_id?: string
          user_provider_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negotiations_user_provider_id_fkey"
            columns: ["user_provider_id"]
            isOneToOne: false
            referencedRelation: "user_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      negotiation_emails: {
        Row: {
          body: string
          created_at: string
          id: string
          negotiation_id: string
          recipient_email: string | null
          sent_at: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          negotiation_id: string
          recipient_email?: string | null
          sent_at?: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          negotiation_id?: string
          recipient_email?: string | null
          sent_at?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "negotiation_emails_negotiation_id_fkey"
            columns: ["negotiation_id"]
            isOneToOne: false
            referencedRelation: "negotiations"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          features: Json
          id: string
          monthly_price: number
          negotiation_id: string
          offer_type: string
          plan_name: string
          provider_name: string | null
          registration_fee: number
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          monthly_price: number
          negotiation_id: string
          offer_type: string
          plan_name: string
          provider_name?: string | null
          registration_fee?: number
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          monthly_price?: number
          negotiation_id?: string
          offer_type?: string
          plan_name?: string
          provider_name?: string | null
          registration_fee?: number
        }
        Relationships: [
          {
            foreignKeyName: "offers_negotiation_id_fkey"
            columns: ["negotiation_id"]
            isOneToOne: false
            referencedRelation: "negotiations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          account_type: string
          biometric_enabled: boolean
          city: string | null
          created_at: string
          id: string
          name: string | null
          onboarding_complete: boolean
          phone: string | null
        }
        Insert: {
          account_type?: string
          biometric_enabled?: boolean
          city?: string | null
          created_at?: string
          id: string
          name?: string | null
          onboarding_complete?: boolean
          phone?: string | null
        }
        Update: {
          account_type?: string
          biometric_enabled?: boolean
          city?: string | null
          created_at?: string
          id?: string
          name?: string | null
          onboarding_complete?: boolean
          phone?: string | null
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          id: string
          user_id: string
          business_name: string
          business_type: string
          employee_count: number | null
          fixed_expenses: string[]
          onboarding_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          business_type: string
          employee_count?: number | null
          fixed_expenses?: string[]
          onboarding_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          business_type?: string
          employee_count?: number | null
          fixed_expenses?: string[]
          onboarding_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_payment_processing: {
        Row: {
          id: string
          user_id: string
          processor_name: string
          current_rate: number | null
          monthly_volume: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          processor_name: string
          current_rate?: number | null
          monthly_volume?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          processor_name?: string
          current_rate?: number | null
          monthly_volume?: number | null
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      providers: {
        Row: {
          category: string
          id: string
          logo_emoji: string | null
          name: string
        }
        Insert: {
          category: string
          id?: string
          logo_emoji?: string | null
          name: string
        }
        Update: {
          category?: string
          id?: string
          logo_emoji?: string | null
          name?: string
        }
        Relationships: []
      }
      savings: {
        Row: {
          amount: number
          created_at: string
          id: string
          quarter: number
          user_id: string
          year: number
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          quarter: number
          user_id: string
          year: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          quarter?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      user_categories: {
        Row: {
          category_name: string
          created_at: string
          details: Json
          id: string
          price_range: string | null
          provider_name: string | null
          registration_fee: number | null
          user_id: string
        }
        Insert: {
          category_name: string
          created_at?: string
          details?: Json
          id?: string
          price_range?: string | null
          provider_name?: string | null
          registration_fee?: number | null
          user_id: string
        }
        Update: {
          category_name?: string
          created_at?: string
          details?: Json
          id?: string
          price_range?: string | null
          provider_name?: string | null
          registration_fee?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_label: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[]
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[]
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[]
          user_id?: string
        }
        Relationships: []
      }
      user_providers: {
        Row: {
          category: string
          created_at: string
          expiry_date: string | null
          id: string
          logo_emoji: string | null
          monthly_price: number | null
          plan_name: string | null
          provider_id: string | null
          provider_name: string
          savings_score: number | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          logo_emoji?: string | null
          monthly_price?: number | null
          plan_name?: string | null
          provider_id?: string | null
          provider_name: string
          savings_score?: number | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          logo_emoji?: string | null
          monthly_price?: number | null
          plan_name?: string | null
          provider_id?: string | null
          provider_name?: string
          savings_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_providers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_activity: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          user_provider_id: string | null
          summary: string
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          user_provider_id?: string | null
          summary: string
          details: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          user_provider_id?: string | null
          summary?: string
          details?: Json
          created_at?: string
        }
        Relationships: []
      }
      action_confirmations: {
        Row: {
          id: string
          user_id: string
          negotiation_id: string | null
          action_type: string
          provider_name: string
          plan_name: string
          monthly_price: number
          contact_email: string | null
          contact_phone: string | null
          rollback: Json
          status: string
          expires_at: string
          created_at: string
          protocol_sent_at: string | null
          resolved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          negotiation_id?: string | null
          action_type: string
          provider_name: string
          plan_name: string
          monthly_price: number
          contact_email?: string | null
          contact_phone?: string | null
          rollback: Json
          status?: string
          expires_at: string
          created_at?: string
          protocol_sent_at?: string | null
          resolved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          negotiation_id?: string | null
          action_type?: string
          provider_name?: string
          plan_name?: string
          monthly_price?: number
          contact_email?: string | null
          contact_phone?: string | null
          rollback?: Json
          status?: string
          expires_at?: string
          created_at?: string
          protocol_sent_at?: string | null
          resolved_at?: string | null
        }
        Relationships: []
      }
      action_confirmation_messages: {
        Row: {
          id: string
          confirmation_id: string
          user_id: string
          channel: string
          subject: string | null
          body: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          confirmation_id: string
          user_id: string
          channel: string
          subject?: string | null
          body: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          confirmation_id?: string
          user_id?: string
          channel?: string
          subject?: string | null
          body?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          email: string | null
          id: string
          kind: string
          user_id: string | null
        }
        Insert: {
          challenge: string
          created_at?: string
          email?: string | null
          id?: string
          kind: string
          user_id?: string | null
        }
        Update: {
          challenge?: string
          created_at?: string
          email?: string | null
          id?: string
          kind?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_monthly_savings_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          rank: number
          first_name: string
          city: string
          total_saved: number
        }[]
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
