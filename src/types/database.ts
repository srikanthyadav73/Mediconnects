export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "receptionist" | "doctor";
export type Gender = "male" | "female" | "other";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type AppointmentType = "new" | "follow_up" | "camp";
export type AppointmentStatus = "booked" | "confirmed" | "completed" | "cancelled" | "no_show";
export type EnquiryStatus = "pending" | "contacted" | "converted" | "archived";
export type ConsentStatus = "opted_in" | "opted_out";
export type ConsentSource = "registration" | "web_form" | "chat_reply_stop" | "chat_reply_start" | "manual_toggle" | "admin";
export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "cancelled";
export type PaymentMethod = "cash" | "upi" | "card" | "razorpay";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type MessageCategory = "utility" | "marketing";
export type MessageStatus = "queued" | "sent" | "delivered" | "read" | "failed";
export type CampaignStatus = "draft" | "scheduled" | "running" | "completed" | "cancelled";
export type CampaignRecipientStatus = "queued" | "sent" | "delivered" | "read" | "failed" | "excluded_no_consent";

export interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: UserRole;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          specialization: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          specialization?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          specialization?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      guardians: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          address: string | null;
          relationship: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          address?: string | null;
          relationship?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          address?: string | null;
          relationship?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      patients: {
        Row: {
          id: string;
          patient_code: string;
          guardian_id: string;
          full_name: string;
          date_of_birth: string;
          gender: Gender;
          blood_group: BloodGroup | null;
          allergies: string[];
          medical_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_code?: string;
          guardian_id: string;
          full_name: string;
          date_of_birth: string;
          gender: Gender;
          blood_group?: BloodGroup | null;
          allergies?: string[];
          medical_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_code?: string;
          guardian_id?: string;
          full_name?: string;
          date_of_birth?: string;
          gender?: Gender;
          blood_group?: BloodGroup | null;
          allergies?: string[];
          medical_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      visits: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string | null;
          visit_date: string;
          chief_complaint: string;
          diagnosis: string | null;
          vitals: Record<string, unknown>;
          prescription: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id?: string | null;
          visit_date?: string;
          chief_complaint: string;
          diagnosis?: string | null;
          vitals?: Record<string, unknown>;
          prescription?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          doctor_id?: string | null;
          visit_date?: string;
          chief_complaint?: string;
          diagnosis?: string | null;
          vitals?: Record<string, unknown>;
          prescription?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          appointment_date: string;
          start_time: string;
          end_time: string;
          type: AppointmentType;
          status: AppointmentStatus;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id: string;
          appointment_date: string;
          start_time: string;
          end_time: string;
          type?: AppointmentType;
          status?: AppointmentStatus;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          doctor_id?: string;
          appointment_date?: string;
          start_time?: string;
          end_time?: string;
          type?: AppointmentType;
          status?: AppointmentStatus;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      website_enquiries: {
        Row: {
          id: string;
          child_name: string;
          child_dob: string | null;
          parent_name: string;
          phone: string;
          email: string | null;
          preferred_date: string | null;
          department_or_reason: string | null;
          whatsapp_consent: boolean;
          status: EnquiryStatus;
          converted_patient_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_name: string;
          child_dob?: string | null;
          parent_name: string;
          phone: string;
          email?: string | null;
          preferred_date?: string | null;
          department_or_reason?: string | null;
          whatsapp_consent?: boolean;
          status?: EnquiryStatus;
          converted_patient_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_name?: string;
          child_dob?: string | null;
          parent_name?: string;
          phone?: string;
          email?: string | null;
          preferred_date?: string | null;
          department_or_reason?: string | null;
          whatsapp_consent?: boolean;
          status?: EnquiryStatus;
          converted_patient_id?: string | null;
          created_at?: string;
        };
      };
      consents: {
        Row: {
          id: string;
          guardian_id: string;
          channel: string;
          status: ConsentStatus;
          source: ConsentSource;
          created_at: string;
        };
        Insert: {
          id?: string;
          guardian_id: string;
          channel?: string;
          status: ConsentStatus;
          source: ConsentSource;
          created_at?: string;
        };
        Update: {
          id?: string;
          guardian_id?: string;
          channel?: string;
          status?: ConsentStatus;
          source?: ConsentSource;
          created_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          category: string;
          default_fee: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          default_fee: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          default_fee?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          visit_id: string | null;
          patient_id: string;
          guardian_id: string;
          total_amount: number;
          discount_amount: number;
          tax_amount: number;
          net_amount: number;
          status: InvoiceStatus;
          due_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_number?: string;
          visit_id?: string | null;
          patient_id: string;
          guardian_id: string;
          total_amount: number;
          discount_amount?: number;
          tax_amount?: number;
          net_amount: number;
          status?: InvoiceStatus;
          due_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          visit_id?: string | null;
          patient_id?: string;
          guardian_id?: string;
          total_amount?: number;
          discount_amount?: number;
          tax_amount?: number;
          net_amount?: number;
          status?: InvoiceStatus;
          due_date?: string;
          created_at?: string;
        };
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          service_id: string | null;
          service_name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          service_id?: string | null;
          service_name: string;
          quantity?: number;
          unit_price: number;
          total_price: number;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          service_id?: string | null;
          service_name?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
        };
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string;
          visit_id: string | null;
          amount: number;
          payment_method: PaymentMethod;
          status: PaymentStatus;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          visit_id?: string | null;
          amount: number;
          payment_method: PaymentMethod;
          status?: PaymentStatus;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          visit_id?: string | null;
          amount?: number;
          payment_method?: PaymentMethod;
          status?: PaymentStatus;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      message_templates: {
        Row: {
          id: string;
          name: string;
          category: MessageCategory;
          language: string;
          body_template: string;
          variables: string[];
          approval_status: "approved" | "pending" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: MessageCategory;
          language?: string;
          body_template: string;
          variables?: string[];
          approval_status?: "approved" | "pending" | "rejected";
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: MessageCategory;
          language?: string;
          body_template?: string;
          variables?: string[];
          approval_status?: "approved" | "pending" | "rejected";
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          guardian_id: string;
          patient_id: string | null;
          phone: string;
          template_id: string | null;
          category: MessageCategory;
          body: string;
          status: MessageStatus;
          provider_message_id: string | null;
          error_message: string | null;
          sent_at: string | null;
          delivered_at: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          guardian_id: string;
          patient_id?: string | null;
          phone: string;
          template_id?: string | null;
          category: MessageCategory;
          body: string;
          status?: MessageStatus;
          provider_message_id?: string | null;
          error_message?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          guardian_id?: string;
          patient_id?: string | null;
          phone?: string;
          template_id?: string | null;
          category?: MessageCategory;
          body?: string;
          status?: MessageStatus;
          provider_message_id?: string | null;
          error_message?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
      };
      medication_reminders: {
        Row: {
          id: string;
          visit_id: string;
          patient_id: string;
          guardian_id: string;
          medication_name: string;
          dosage: string;
          frequency: string;
          scheduled_time: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          visit_id: string;
          patient_id: string;
          guardian_id: string;
          medication_name: string;
          dosage: string;
          frequency: string;
          scheduled_time: string;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          visit_id?: string;
          patient_id?: string;
          guardian_id?: string;
          medication_name?: string;
          dosage?: string;
          frequency?: string;
          scheduled_time?: string;
          start_date?: string;
          end_date?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          title: string;
          template_id: string;
          status: CampaignStatus;
          scheduled_at: string | null;
          audience_criteria: Record<string, unknown>;
          total_target: number;
          sent_count: number;
          delivered_count: number;
          read_count: number;
          failed_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          template_id: string;
          status?: CampaignStatus;
          scheduled_at?: string | null;
          audience_criteria?: Record<string, unknown>;
          total_target?: number;
          sent_count?: number;
          delivered_count?: number;
          read_count?: number;
          failed_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          template_id?: string;
          status?: CampaignStatus;
          scheduled_at?: string | null;
          audience_criteria?: Record<string, unknown>;
          total_target?: number;
          sent_count?: number;
          delivered_count?: number;
          read_count?: number;
          failed_count?: number;
          created_at?: string;
        };
      };
      campaign_recipients: {
        Row: {
          id: string;
          campaign_id: string;
          guardian_id: string;
          patient_id: string | null;
          status: CampaignRecipientStatus;
          message_id: string | null;
          error_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          guardian_id: string;
          patient_id?: string | null;
          status?: CampaignRecipientStatus;
          message_id?: string | null;
          error_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          guardian_id?: string;
          patient_id?: string | null;
          status?: CampaignRecipientStatus;
          message_id?: string | null;
          error_reason?: string | null;
          created_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          old_values: Record<string, unknown> | null;
          new_values: Record<string, unknown> | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          table_name: string;
          record_id?: string | null;
          old_values?: Record<string, unknown> | null;
          new_values?: Record<string, unknown> | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          old_values?: Record<string, unknown> | null;
          new_values?: Record<string, unknown> | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      daily_visits: {
        Row: {
          visit_day: string;
          total_visits: number;
          unique_patients: number;
        };
      };
      new_vs_returning: {
        Row: {
          visit_day: string;
          new_patients: number;
          returning_patients: number;
          total_visits: number;
        };
      };
      revenue_daily: {
        Row: {
          payment_day: string;
          cash_collected: number;
          upi_collected: number;
          card_collected: number;
          razorpay_collected: number;
          total_collected: number;
        };
      };
      outstanding_balances: {
        Row: {
          invoice_id: string;
          invoice_number: string;
          patient_id: string;
          patient_name: string;
          patient_code: string;
          guardian_id: string;
          guardian_name: string;
          guardian_phone: string;
          net_amount: number;
          paid_amount: number;
          balance_due: number;
          status: InvoiceStatus;
          due_date: string;
          created_at: string;
        };
      };
      campaign_stats: {
        Row: {
          campaign_id: string;
          title: string;
          status: CampaignStatus;
          scheduled_at: string | null;
          created_at: string;
          total_recipients: number;
          sent_count: number;
          delivered_count: number;
          read_count: number;
          failed_count: number;
          excluded_no_consent_count: number;
        };
      };
    };
    Functions: {
      has_role: {
        Args: { required_role: string };
        Returns: boolean;
      };
      is_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_guardian_opted_in: {
        Args: { p_guardian_id: string };
        Returns: boolean;
      };
    };
  };
}
