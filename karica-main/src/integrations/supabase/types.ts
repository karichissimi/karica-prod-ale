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
      automation_rules: {
        Row: {
          action: string
          created_at: string | null
          device_id: string
          id: string
          is_active: boolean | null
          name: string
          trigger_type: string
          trigger_value: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          device_id: string
          id?: string
          is_active?: boolean | null
          name: string
          trigger_type: string
          trigger_value: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          device_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_type?: string
          trigger_value?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_uploads: {
        Row: {
          created_at: string | null
          file_path: string
          id: string
          ocr_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_path: string
          id?: string
          ocr_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_path?: string
          id?: string
          ocr_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cer_communities: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          total_energy_shared: number | null
          total_members: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          total_energy_shared?: number | null
          total_members?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          total_energy_shared?: number | null
          total_members?: number | null
        }
        Relationships: []
      }
      cer_consents: {
        Row: {
          cer_rules_consent: boolean
          created_at: string | null
          data_sharing_consent: boolean
          id: string
          strong_id_completed: boolean
          strong_id_method: string | null
          strong_id_timestamp: string | null
          terms_conditions_consent: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cer_rules_consent?: boolean
          created_at?: string | null
          data_sharing_consent?: boolean
          id?: string
          strong_id_completed?: boolean
          strong_id_method?: string | null
          strong_id_timestamp?: string | null
          terms_conditions_consent?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cer_rules_consent?: boolean
          created_at?: string | null
          data_sharing_consent?: boolean
          id?: string
          strong_id_completed?: boolean
          strong_id_method?: string | null
          strong_id_timestamp?: string | null
          terms_conditions_consent?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cer_managers: {
        Row: {
          appointment_document_url: string | null
          cer_address: string | null
          cer_fiscal_code: string | null
          cer_name: string | null
          community_id: string | null
          created_at: string | null
          id: string
          member_count: number | null
          partner_id: string
          role: string
          statute_document_url: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_document_url?: string | null
          cer_address?: string | null
          cer_fiscal_code?: string | null
          cer_name?: string | null
          community_id?: string | null
          created_at?: string | null
          id?: string
          member_count?: number | null
          partner_id: string
          role?: string
          statute_document_url?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_document_url?: string | null
          cer_address?: string | null
          cer_fiscal_code?: string | null
          cer_name?: string | null
          community_id?: string | null
          created_at?: string | null
          id?: string
          member_count?: number | null
          partner_id?: string
          role?: string
          statute_document_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cer_managers_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "cer_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cer_managers_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "cer_statistics"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "cer_managers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partner_dashboard"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "cer_managers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      cer_memberships: {
        Row: {
          community_id: string
          energy_contributed: number | null
          id: string
          joined_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          energy_contributed?: number | null
          id?: string
          joined_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          energy_contributed?: number | null
          id?: string
          joined_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cer_memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "cer_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cer_memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "cer_statistics"
            referencedColumns: ["community_id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          invoiced_at: string | null
          paid_at: string | null
          partner_id: string | null
          source_id: string
          source_type: string
          status: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          invoiced_at?: string | null
          paid_at?: string | null
          partner_id?: string | null
          source_id: string
          source_type: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          invoiced_at?: string | null
          paid_at?: string | null
          partner_id?: string | null
          source_id?: string
          source_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_dashboard"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          brand: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_smart: boolean | null
          name: string
          power_rating: number | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_smart?: boolean | null
          name: string
          power_rating?: number | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_smart?: boolean | null
          name?: string
          power_rating?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      energy_readings: {
        Row: {
          consumption_kwh: number
          cost_eur: number | null
          device_id: string | null
          id: string
          reading_type: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          consumption_kwh: number
          cost_eur?: number | null
          device_id?: string | null
          id?: string
          reading_type?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          consumption_kwh?: number
          cost_eur?: number | null
          device_id?: string | null
          id?: string
          reading_type?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_readings_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      home_analysis: {
        Row: {
          bill_analysis: Json | null
          calculation_details: Json | null
          combined_energy_class: string | null
          completed_at: string | null
          confidence_level: number | null
          created_at: string
          estimated_extra_cost_yearly: number | null
          external_analysis: Json | null
          heating_analysis: Json | null
          id: string
          recommendations: Json | null
          square_meters: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bill_analysis?: Json | null
          calculation_details?: Json | null
          combined_energy_class?: string | null
          completed_at?: string | null
          confidence_level?: number | null
          created_at?: string
          estimated_extra_cost_yearly?: number | null
          external_analysis?: Json | null
          heating_analysis?: Json | null
          id?: string
          recommendations?: Json | null
          square_meters?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bill_analysis?: Json | null
          calculation_details?: Json | null
          combined_energy_class?: string | null
          completed_at?: string | null
          confidence_level?: number | null
          created_at?: string
          estimated_extra_cost_yearly?: number | null
          external_analysis?: Json | null
          heating_analysis?: Json | null
          id?: string
          recommendations?: Json | null
          square_meters?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      intervention_types: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      interventions: {
        Row: {
          category: string
          completed_at: string | null
          cost_eur: number | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          estimated_savings: number | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          completed_at?: string | null
          cost_eur?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          estimated_savings?: number | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          cost_eur?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          estimated_savings?: number | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lead_messages: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          message: string
          sender_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          message: string
          sender_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          message?: string
          sender_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          calculator_data: Json | null
          completed_at: string | null
          completion_document_url: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          intervention_type_id: string | null
          invoice_status: string | null
          notes: string | null
          partner_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calculator_data?: Json | null
          completed_at?: string | null
          completion_document_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          intervention_type_id?: string | null
          invoice_status?: string | null
          notes?: string | null
          partner_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calculator_data?: Json | null
          completed_at?: string | null
          completion_document_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          intervention_type_id?: string | null
          invoice_status?: string | null
          notes?: string | null
          partner_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_intervention_type_id_fkey"
            columns: ["intervention_type_id"]
            isOneToOne: false
            referencedRelation: "intervention_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_dashboard"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "leads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_partners: {
        Row: {
          commission_rate: number | null
          created_at: string
          description: string | null
          id: string
          interest_rate_max: number | null
          interest_rate_min: number | null
          is_active: boolean | null
          logo_url: string | null
          max_amount: number | null
          max_duration_months: number | null
          min_amount: number | null
          name: string
          updated_at: string
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          interest_rate_max?: number | null
          interest_rate_min?: number | null
          is_active?: boolean | null
          logo_url?: string | null
          max_amount?: number | null
          max_duration_months?: number | null
          min_amount?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          interest_rate_max?: number | null
          interest_rate_min?: number | null
          is_active?: boolean | null
          logo_url?: string | null
          max_amount?: number | null
          max_duration_months?: number | null
          min_amount?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      loan_requests: {
        Row: {
          amount_requested: number
          commission_amount: number | null
          created_at: string
          decided_at: string | null
          duration_months: number
          id: string
          interest_rate: number | null
          intervention_id: string | null
          loan_partner_id: string | null
          monthly_payment: number | null
          notes: string | null
          purpose: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_requested: number
          commission_amount?: number | null
          created_at?: string
          decided_at?: string | null
          duration_months: number
          id?: string
          interest_rate?: number | null
          intervention_id?: string | null
          loan_partner_id?: string | null
          monthly_payment?: number | null
          notes?: string | null
          purpose?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_requested?: number
          commission_amount?: number | null
          created_at?: string
          decided_at?: string | null
          duration_months?: number
          id?: string
          interest_rate?: number | null
          intervention_id?: string | null
          loan_partner_id?: string | null
          monthly_payment?: number | null
          notes?: string | null
          purpose?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_requests_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_requests_loan_partner_id_fkey"
            columns: ["loan_partner_id"]
            isOneToOne: false
            referencedRelation: "loan_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_partners: {
        Row: {
          approved_at: string | null
          catalog_approved: boolean | null
          created_at: string | null
          fiscal_documents_url: string | null
          id: string
          partner_id: string
          product_categories: string[] | null
          return_policy: string | null
          shipping_policy: string | null
          store_description: string | null
          store_logo_url: string | null
          store_name: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          catalog_approved?: boolean | null
          created_at?: string | null
          fiscal_documents_url?: string | null
          id?: string
          partner_id: string
          product_categories?: string[] | null
          return_policy?: string | null
          shipping_policy?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          catalog_approved?: boolean | null
          created_at?: string | null
          fiscal_documents_url?: string | null
          id?: string
          partner_id?: string
          product_categories?: string[] | null
          return_policy?: string | null
          shipping_policy?: string | null
          store_description?: string | null
          store_logo_url?: string | null
          store_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_partners_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partner_dashboard"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "marketplace_partners_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          product_id: string | null
          product_name: string
          product_price: number
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          product_name: string
          product_price: number
          quantity?: number
          subtotal: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          product_name?: string
          product_price?: number
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          commission_amount: number
          created_at: string
          delivered_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_amount: number | null
          status: string
          subtotal_amount: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          commission_amount?: number
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: string
          subtotal_amount?: number
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          commission_amount?: number
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: string
          subtotal_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_requests: {
        Row: {
          company_name: string
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          intervention_types: string[] | null
          partner_type: Database["public"]["Enums"]["partner_type"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          intervention_types?: string[] | null
          partner_type?: Database["public"]["Enums"]["partner_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          intervention_types?: string[] | null
          partner_type?: Database["public"]["Enums"]["partner_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_specializations: {
        Row: {
          created_at: string | null
          id: string
          intervention_type_id: string | null
          partner_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intervention_type_id?: string | null
          partner_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intervention_type_id?: string | null
          partner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_specializations_intervention_type_id_fkey"
            columns: ["intervention_type_id"]
            isOneToOne: false
            referencedRelation: "intervention_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_specializations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_dashboard"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_specializations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          business_document_url: string | null
          company_name: string
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          partner_type: Database["public"]["Enums"]["partner_type"]
          rating: number | null
          terms_accepted_at: string | null
          updated_at: string | null
          user_id: string | null
          vat_number: string | null
        }
        Insert: {
          business_document_url?: string | null
          company_name: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          partner_type?: Database["public"]["Enums"]["partner_type"]
          rating?: number | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_number?: string | null
        }
        Update: {
          business_document_url?: string | null
          company_name?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          partner_type?: Database["public"]["Enums"]["partner_type"]
          rating?: number | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          commission_rate: number | null
          created_at: string
          description: string | null
          features: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          original_price_eur: number | null
          partner_id: string | null
          price_eur: number
          specifications: Json | null
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          original_price_eur?: number | null
          partner_id?: string | null
          price_eur: number
          specifications?: Json | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          original_price_eur?: number | null
          partner_id?: string | null
          price_eur?: number
          specifications?: Json | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_dashboard"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "products_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          annual_consumption_kwh: number | null
          avatar_url: string | null
          cer_eligible: boolean | null
          cer_onboarding_completed: boolean | null
          cer_onboarding_completed_at: string | null
          cer_onboarding_started_at: string | null
          created_at: string | null
          email: string | null
          energy_supplier: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          phone: string | null
          pod: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          annual_consumption_kwh?: number | null
          avatar_url?: string | null
          cer_eligible?: boolean | null
          cer_onboarding_completed?: boolean | null
          cer_onboarding_completed_at?: string | null
          cer_onboarding_started_at?: string | null
          created_at?: string | null
          email?: string | null
          energy_supplier?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          pod?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          annual_consumption_kwh?: number | null
          avatar_url?: string | null
          cer_eligible?: boolean | null
          cer_onboarding_completed?: boolean | null
          cer_onboarding_completed_at?: string | null
          cer_onboarding_started_at?: string | null
          created_at?: string | null
          email?: string | null
          energy_supplier?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          pod?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          created_at: string | null
          id: string
          marketing_consent: boolean
          monitoring_consent: boolean
          service_consent: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          marketing_consent?: boolean
          monitoring_consent?: boolean
          service_consent?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          marketing_consent?: boolean
          monitoring_consent?: boolean
          service_consent?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          achievements: Json | null
          created_at: string | null
          id: string
          level: number | null
          points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievements?: Json | null
          created_at?: string | null
          id?: string
          level?: number | null
          points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievements?: Json | null
          created_at?: string | null
          id?: string
          level?: number | null
          points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      cer_statistics: {
        Row: {
          active_members: number | null
          community_id: string | null
          community_name: string | null
          total_contributed: number | null
          total_energy_shared: number | null
          total_members: number | null
        }
        Insert: {
          active_members?: never
          community_id?: string | null
          community_name?: string | null
          total_contributed?: never
          total_energy_shared?: number | null
          total_members?: number | null
        }
        Update: {
          active_members?: never
          community_id?: string | null
          community_name?: string | null
          total_contributed?: never
          total_energy_shared?: number | null
          total_members?: number | null
        }
        Relationships: []
      }
      partner_dashboard: {
        Row: {
          company_name: string | null
          completed_leads: number | null
          in_progress_leads: number | null
          is_active: boolean | null
          new_leads: number | null
          partner_id: string | null
          rating: number | null
          specializations: string[] | null
          total_leads: number | null
          user_id: string | null
        }
        Insert: {
          company_name?: string | null
          completed_leads?: never
          in_progress_leads?: never
          is_active?: boolean | null
          new_leads?: never
          partner_id?: string | null
          rating?: number | null
          specializations?: never
          total_leads?: never
          user_id?: string | null
        }
        Update: {
          company_name?: string | null
          completed_leads?: never
          in_progress_leads?: never
          is_active?: boolean | null
          new_leads?: never
          partner_id?: string | null
          rating?: number | null
          specializations?: never
          total_leads?: never
          user_id?: string | null
        }
        Relationships: []
      }
      user_statistics: {
        Row: {
          cer_onboarding_completed: boolean | null
          completed_leads: number | null
          email: string | null
          full_name: string | null
          level: number | null
          onboarding_completed: boolean | null
          total_consumption_kwh: number | null
          total_devices: number | null
          total_interventions: number | null
          total_leads: number | null
          total_points: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_system_notification: {
        Args: {
          notification_action_url?: string
          notification_message: string
          notification_metadata?: Json
          notification_title: string
          notification_type?: string
          target_user_id: string
        }
        Returns: string
      }
      get_user_dashboard_stats: { Args: { p_user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "consumer" | "partner" | "admin"
      partner_type: "cer_president" | "intervention" | "marketplace"
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
      app_role: ["consumer", "partner", "admin"],
      partner_type: ["cer_president", "intervention", "marketplace"],
    },
  },
} as const
