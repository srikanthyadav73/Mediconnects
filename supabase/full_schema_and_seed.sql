-- ==============================================================================
-- CareBridge: Children's Hospital CRM & Analytics Platform Schema
-- Migration: 20261029000000_carebridge_schema.sql
-- ==============================================================================

-- 1. EXTENSIONS & SEQUENCES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE SEQUENCE IF NOT EXISTS patient_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_code_seq START 1;

-- 2. ROLES TABLE & HELPER FUNCTIONS
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'receptionist', 'doctor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Security Definer function to check if the current user has a role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = required_role
  );
END;
$$;

-- Security Definer function to check if the current user is any hospital staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist', 'doctor')
  );
END;
$$;

-- Function to get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE WHEN role = 'admin' THEN 1 WHEN role = 'doctor' THEN 2 ELSE 3 END
  LIMIT 1;
  RETURN v_role;
END;
$$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  specialization TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. GUARDIANS (E.164 UNIQUE PHONE)
CREATE TABLE IF NOT EXISTS public.guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE, -- E.164 +91XXXXXXXXXX
  email TEXT,
  address TEXT,
  relationship TEXT NOT NULL DEFAULT 'Parent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardians_phone ON public.guardians(phone);
CREATE INDEX IF NOT EXISTS idx_guardians_name ON public.guardians(name);

-- 5. PATIENTS (ONE PATIENT = ONE ROW)
CREATE OR REPLACE FUNCTION generate_patient_code()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'PT-2026-' || LPAD(nextval('patient_code_seq')::text, 6, '0');
$$;

CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code TEXT NOT NULL UNIQUE DEFAULT generate_patient_code(),
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  allergies TEXT[] NOT NULL DEFAULT '{}',
  medical_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_guardian_id ON public.patients(guardian_id);
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON public.patients(full_name);
CREATE INDEX IF NOT EXISTS idx_patients_code ON public.patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_patients_name_dob ON public.patients(full_name, date_of_birth);

-- 6. VISITS (EVERY RETURN = A NEW ROW)
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  visit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  chief_complaint TEXT NOT NULL,
  diagnosis TEXT,
  vitals JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. weight_kg, height_cm, temp_c, bp, spo2
  prescription TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON public.visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON public.visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON public.visits(visit_date);

-- 7. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type TEXT NOT NULL DEFAULT 'new' CHECK (type IN ('new', 'follow_up', 'camp')),
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'confirmed', 'completed', 'cancelled', 'no_show')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_appointment_times CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);

-- 8. WEBSITE ENQUIRIES (PUBLIC CONTACT FORM)
CREATE TABLE IF NOT EXISTS public.website_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name TEXT NOT NULL,
  child_dob DATE,
  parent_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  preferred_date DATE,
  department_or_reason TEXT,
  whatsapp_consent BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'archived')),
  converted_patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.website_enquiries(status);

-- 9. CONSENTS (WHATSAPP OPTED_IN / OPTED_OUT)
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL CHECK (status IN ('opted_in', 'opted_out')),
  source TEXT NOT NULL CHECK (source IN ('registration', 'web_form', 'chat_reply_stop', 'chat_reply_start', 'manual_toggle', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consents_guardian_created ON public.consents(guardian_id, created_at DESC);

-- Helper to check if a guardian is currently opted in
CREATE OR REPLACE FUNCTION public.is_guardian_opted_in(p_guardian_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT status = 'opted_in'
     FROM public.consents
     WHERE guardian_id = p_guardian_id AND channel = 'whatsapp'
     ORDER BY created_at DESC
     LIMIT 1),
    FALSE
  );
$$;

-- 10. SERVICES & TARIFFS
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'consultation',
  default_fee NUMERIC(10,2) NOT NULL CHECK (default_fee >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. INVOICES
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'INV-2026-' || LPAD(nextval('invoice_code_seq')::text, 6, '0');
$$;

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE DEFAULT generate_invoice_number(),
  visit_id UUID REFERENCES public.visits(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE RESTRICT,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  net_amount NUMERIC(10,2) NOT NULL CHECK (net_amount >= 0),
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'partially_paid', 'paid', 'cancelled')),
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON public.invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_visit_id ON public.invoices(visit_id);

-- 12. INVOICE ITEMS
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT,
  service_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- 13. PAYMENTS (TIED TO VISIT_ID & INVOICE_ID)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'card', 'razorpay')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_visit_id ON public.payments(visit_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 14. MESSAGE TEMPLATES
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('utility', 'marketing')),
  language TEXT NOT NULL DEFAULT 'en',
  body_template TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT '{}',
  approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('approved', 'pending', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  template_id UUID REFERENCES public.message_templates(id),
  category TEXT NOT NULL CHECK (category IN ('utility', 'marketing')),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_guardian_id ON public.messages(guardian_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- 16. MEDICATION REMINDERS
CREATE TABLE IF NOT EXISTS public.medication_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL, -- e.g. "Every 8 hours", "Once daily after meals"
  scheduled_time TIME NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_med_reminders_patient ON public.medication_reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_med_reminders_active ON public.medication_reminders(is_active);

-- 17. CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  template_id UUID NOT NULL REFERENCES public.message_templates(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  audience_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_target INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  delivered_count INT NOT NULL DEFAULT 0,
  read_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. CAMPAIGN RECIPIENTS (GUARDIAN-LEVEL UNIQUE DEDUPE)
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed', 'excluded_no_consent')),
  message_id UUID REFERENCES public.messages(id),
  error_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT campaign_guardian_unique UNIQUE (campaign_id, guardian_id) -- Dedupe at GUARDIAN level
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON public.campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_guardian ON public.campaign_recipients(guardian_id);

-- 19. AUDIT LOG
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log(table_name);

-- 20. ANALYTICS VIEWS
-- View: daily_visits
CREATE OR REPLACE VIEW public.daily_visits AS
SELECT
  DATE_TRUNC('day', visit_date)::DATE AS visit_day,
  COUNT(id) AS total_visits,
  COUNT(DISTINCT patient_id) AS unique_patients
FROM public.visits
GROUP BY DATE_TRUNC('day', visit_date)::DATE
ORDER BY visit_day DESC;

-- View: new_vs_returning
CREATE OR REPLACE VIEW public.new_vs_returning AS
WITH patient_first_visits AS (
  SELECT
    patient_id,
    MIN(visit_date)::DATE AS first_visit_date
  FROM public.visits
  GROUP BY patient_id
)
SELECT
  v.visit_date::DATE AS visit_day,
  COUNT(DISTINCT CASE WHEN pf.first_visit_date = v.visit_date::DATE THEN v.patient_id END) AS new_patients,
  COUNT(DISTINCT CASE WHEN pf.first_visit_date < v.visit_date::DATE THEN v.patient_id END) AS returning_patients,
  COUNT(v.id) AS total_visits
FROM public.visits v
JOIN patient_first_visits pf ON v.patient_id = pf.patient_id
GROUP BY v.visit_date::DATE
ORDER BY visit_day DESC;

-- View: revenue_daily
CREATE OR REPLACE VIEW public.revenue_daily AS
SELECT
  DATE_TRUNC('day', created_at)::DATE AS payment_day,
  COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) AS cash_collected,
  COALESCE(SUM(CASE WHEN payment_method = 'upi' THEN amount ELSE 0 END), 0) AS upi_collected,
  COALESCE(SUM(CASE WHEN payment_method = 'card' THEN amount ELSE 0 END), 0) AS card_collected,
  COALESCE(SUM(CASE WHEN payment_method = 'razorpay' THEN amount ELSE 0 END), 0) AS razorpay_collected,
  COALESCE(SUM(amount), 0) AS total_collected
FROM public.payments
WHERE status = 'paid'
GROUP BY DATE_TRUNC('day', created_at)::DATE
ORDER BY payment_day DESC;

-- View: outstanding_balances
CREATE OR REPLACE VIEW public.outstanding_balances AS
WITH payment_totals AS (
  SELECT
    invoice_id,
    COALESCE(SUM(amount), 0) AS total_paid
  FROM public.payments
  WHERE status = 'paid'
  GROUP BY invoice_id
)
SELECT
  i.id AS invoice_id,
  i.invoice_number,
  i.patient_id,
  p.full_name AS patient_name,
  p.patient_code,
  i.guardian_id,
  g.name AS guardian_name,
  g.phone AS guardian_phone,
  i.net_amount,
  COALESCE(pt.total_paid, 0) AS paid_amount,
  (i.net_amount - COALESCE(pt.total_paid, 0)) AS balance_due,
  i.status,
  i.due_date,
  i.created_at
FROM public.invoices i
JOIN public.patients p ON i.patient_id = p.id
JOIN public.guardians g ON i.guardian_id = g.id
LEFT JOIN payment_totals pt ON i.id = pt.invoice_id
WHERE (i.net_amount - COALESCE(pt.total_paid, 0)) > 0 AND i.status != 'cancelled'
ORDER BY balance_due DESC;

-- View: campaign_stats
CREATE OR REPLACE VIEW public.campaign_stats AS
SELECT
  c.id AS campaign_id,
  c.title,
  c.status,
  c.scheduled_at,
  c.created_at,
  COUNT(cr.id) AS total_recipients,
  COUNT(CASE WHEN cr.status = 'sent' THEN 1 END) AS sent_count,
  COUNT(CASE WHEN cr.status = 'delivered' THEN 1 END) AS delivered_count,
  COUNT(CASE WHEN cr.status = 'read' THEN 1 END) AS read_count,
  COUNT(CASE WHEN cr.status = 'failed' THEN 1 END) AS failed_count,
  COUNT(CASE WHEN cr.status = 'excluded_no_consent' THEN 1 END) AS excluded_no_consent_count
FROM public.campaigns c
LEFT JOIN public.campaign_recipients cr ON c.id = cr.campaign_id
GROUP BY c.id, c.title, c.status, c.scheduled_at, c.created_at
ORDER BY c.created_at DESC;

-- 21. ROW LEVEL SECURITY (RLS ON EVERY TABLE)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 22. POLICIES

-- user_roles: only Admin can read & manage
CREATE POLICY "Admin manages all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

CREATE POLICY "Users can read own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- profiles: staff can read all profiles; users can update own profile; admin manages all
CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admin can insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role('admin') OR auth.uid() = id);

CREATE POLICY "Admin can delete profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_role('admin'));

-- guardians: staff have full access
CREATE POLICY "Staff can manage guardians" ON public.guardians
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- patients: staff have full access
CREATE POLICY "Staff can manage patients" ON public.patients
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- visits: staff have full access
CREATE POLICY "Staff can manage visits" ON public.visits
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- appointments: staff have full access
CREATE POLICY "Staff can manage appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- website_enquiries: anon can INSERT; staff can view and update
CREATE POLICY "Public anonymous users can insert enquiries" ON public.website_enquiries
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Staff can view and update enquiries" ON public.website_enquiries
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- consents: staff have full access
CREATE POLICY "Staff can manage consents" ON public.consents
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- services: staff can read services; admin can insert/update/delete
CREATE POLICY "Staff can view services" ON public.services
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "Admin can manage services" ON public.services
  FOR ALL TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

-- invoices & invoice_items: staff have full access
CREATE POLICY "Staff can manage invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "Staff can manage invoice_items" ON public.invoice_items
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- payments: staff have full access
CREATE POLICY "Staff can manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- message_templates: staff can read; admin can manage
CREATE POLICY "Staff can view message_templates" ON public.message_templates
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "Admin can manage message_templates" ON public.message_templates
  FOR ALL TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

-- messages: staff can read and insert; admin full access
CREATE POLICY "Staff can view messages" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "Staff can create messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY "Admin can manage messages" ON public.messages
  FOR ALL TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

-- medication_reminders: staff have full access
CREATE POLICY "Staff can manage medication_reminders" ON public.medication_reminders
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- campaigns & campaign_recipients: admin full access; staff can view
CREATE POLICY "Staff can view campaigns" ON public.campaigns
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "Admin can manage campaigns" ON public.campaigns
  FOR ALL TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

CREATE POLICY "Staff can view campaign_recipients" ON public.campaign_recipients
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY "Admin can manage campaign_recipients" ON public.campaign_recipients
  FOR ALL TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

-- audit_log: admin only
CREATE POLICY "Admin can read audit_log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.has_role('admin'));

CREATE POLICY "Staff can insert audit_log" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());
-- ==============================================================================
-- CareBridge: Seed Data
-- 30 guardians, 40 patients, 120 visits, appointments, services, invoices, payments, campaigns
-- ==============================================================================

-- 1. SERVICES
INSERT INTO public.services (id, name, category, default_fee, is_active) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Pediatric General Consultation', 'consultation', 600.00, true),
  ('11111111-1111-1111-1111-111111111102', 'Well-Baby & Growth Assessment', 'consultation', 800.00, true),
  ('11111111-1111-1111-1111-111111111103', 'Pediatric Pulmonology Follow-up', 'consultation', 750.00, true),
  ('11111111-1111-1111-1111-111111111104', 'MMR / DTP Vaccine Administration', 'immunization', 1200.00, true),
  ('11111111-1111-1111-1111-111111111105', 'Influenza Quadrivalent Vaccine', 'immunization', 1800.00, true),
  ('11111111-1111-1111-1111-111111111106', 'Nebulization Session (Pediatric)', 'procedure', 350.00, true),
  ('11111111-1111-1111-1111-111111111107', 'Emergency Pediatric Triage & Observation', 'emergency', 1500.00, true),
  ('11111111-1111-1111-1111-111111111108', 'Complete Blood Count (CBC Micro)', 'laboratory', 450.00, true)
ON CONFLICT (id) DO NOTHING;

-- 2. MESSAGE TEMPLATES
INSERT INTO public.message_templates (id, name, category, language, body_template, variables, approval_status) VALUES
  ('22222222-2222-2222-2222-222222222201', 'appointment_reminder_24h', 'utility', 'en', 'Namaste {{1}}. Reminder: Appointment for {{2}} with {{3}} is scheduled for tomorrow at {{4}} at CareBridge Children Hospital. Reply 1 to Confirm or 2 to Reschedule. Reply STOP to opt out.', ARRAY['guardian_name', 'patient_name', 'doctor_name', 'time'], 'approved'),
  ('22222222-2222-2222-2222-222222222202', 'appointment_reminder_2h', 'utility', 'en', 'Namaste {{1}}. Your child {{2}} appointment with {{3}} is in 2 hours at {{4}}. Please arrive 10 mins early with previous prescription records.', ARRAY['guardian_name', 'patient_name', 'doctor_name', 'time'], 'approved'),
  ('22222222-2222-2222-2222-222222222203', 'medication_alert', 'utility', 'en', 'Hello {{1}}, reminder to administer {{2}} ({{3}}) for {{4}}. Schedule: {{5}}.', ARRAY['guardian_name', 'medicine', 'dosage', 'patient_name', 'time'], 'approved'),
  ('22222222-2222-2222-2222-222222222204', 'monsoon_flu_drive_2026', 'marketing', 'en', 'Dear {{1}}, Protect your child this monsoon! CareBridge is hosting a Pediatric Flu & Immunization Camp on Saturday with 20% off health checkups. Reply YES to book a priority slot or STOP to unsubscribe.', ARRAY['guardian_name'], 'approved'),
  ('22222222-2222-2222-2222-222222222205', 'growth_milestone_camp', 'marketing', 'en', 'Dear {{1}}, Track your child milestones with our Senior Pediatricians this Sunday. Free nutrition and growth chart screening. Reply YES to book or STOP to opt out.', ARRAY['guardian_name'], 'approved')
ON CONFLICT (id) DO NOTHING;

-- 3. 30 GUARDIANS
INSERT INTO public.guardians (id, name, phone, email, address, relationship) VALUES
  ('33333333-3333-3333-3333-333333333301', 'Rajesh Sharma', '+919820011001', 'rajesh.sharma@example.com', 'Andheri West, Mumbai', 'Father'),
  ('33333333-3333-3333-3333-333333333302', 'Priya Patel', '+919820011002', 'priya.patel@example.com', 'Vashi, Navi Mumbai', 'Mother'),
  ('33333333-3333-3333-3333-333333333303', 'Amitabh Verma', '+919820011003', 'amitabh.v@example.com', 'Bandra East, Mumbai', 'Father'),
  ('33333333-3333-3333-3333-333333333304', 'Sneha Kulkarni', '+919820011004', 'sneha.k@example.com', 'Thane West', 'Mother'),
  ('33333333-3333-3333-3333-333333333305', 'Vikram Malhotra', '+919820011005', 'vikram.m@example.com', 'Juhu, Mumbai', 'Father'),
  ('33333333-3333-3333-3333-333333333306', 'Ananya Deshmukh', '+919820011006', 'ananya.d@example.com', 'Dadar, Mumbai', 'Mother'),
  ('33333333-3333-3333-3333-333333333307', 'Karthik Iyer', '+919820011007', 'karthik.i@example.com', 'Chembur, Mumbai', 'Father'),
  ('33333333-3333-3333-3333-333333333308', 'Meera Nair', '+919820011008', 'meera.nair@example.com', 'Powai, Mumbai', 'Mother'),
  ('33333333-3333-3333-3333-333333333309', 'Sanjay Gupta', '+919820011009', 'sanjay.gupta@example.com', 'Goregaon East, Mumbai', 'Father'),
  ('33333333-3333-3333-3333-333333333310', 'Ritu Aggarwal', '+919820011010', 'ritu.aggarwal@example.com', 'Khar West, Mumbai', 'Mother'),
  ('33333333-3333-3333-3333-333333333311', 'Gaurav Joshi', '+919820011011', 'gaurav.j@example.com', 'Borivali, Mumbai', 'Father'),
  ('33333333-3333-3333-3333-333333333312', 'Pooja Reddy', '+919820011012', 'pooja.reddy@example.com', 'Mulund West, Mumbai', 'Mother'),
  ('33333333-3333-3333-3333-333333333313', 'Arun Saxena', '+919820011013', 'arun.saxena@example.com', 'Kalyan, Thane', 'Father'),
  ('33333333-3333-3333-3333-333333333314', 'Divya Menon', '+919820011014', 'divya.m@example.com', 'Ghatkopar, Mumbai', 'Mother'),
  ('33333333-3333-3333-3333-333333333315', 'Nitin Sen', '+919820011015', 'nitin.sen@example.com', 'Santacruz West, Mumbai', 'Father'),
  ('33333333-3333-3333-3333-333333333316', 'Shweta Banerjee', '+919820011016', 'shweta.b@example.com', 'Sion, Mumbai', 'Mother'),
  ('33333333-3333-3333-3333-333333333317', 'Deepak Chauhan', '+919820011017', 'deepak.c@example.com', 'Malad West, Mumbai', 'Father'),
  ('33333333-3333-3333-3333-333333333318', 'Tanvi Mehta', '+919820011018', 'tanvi.m@example.com', 'Colaba, Mumbai', 'Mother'),
  ('33333333-3333-3333-3333-333333333319', 'Manoj Rao', '+919820011019', 'manoj.rao@example.com', 'Kandivali, Mumbai', 'Father'),
  ('33333333-3333-3333-3333-333333333320', 'Kavita Pillai', '+919820011020', 'kavita.p@example.com', 'Nerul, Navi Mumbai', 'Mother'),
  ('33333333-3333-3333-3333-333333333321', 'Rohan Bhatia', '+919820011021', 'rohan.b@example.com', 'Bhayandar, Thane', 'Father'),
  ('33333333-3333-3333-3333-333333333322', 'Alka Singhania', '+919820011022', 'alka.s@example.com', 'Lower Parel, Mumbai', 'Mother'),
  ('33333333-3333-3333-3333-333333333323', 'Sunil Nambiar', '+919820011023', 'sunil.n@example.com', 'Worli, Mumbai', 'Father'),
  ('33333333-3333-3333-3333-333333333324', 'Neha Kapoor', '+919820011024', 'neha.kapoor@example.com', 'Bandra West, Mumbai', 'Mother'),
  ('33333333-3333-3333-3333-333333333325', 'Harish Tiwari', '+919820011025', 'harish.t@example.com', 'Airoli, Navi Mumbai', 'Father'),
  ('33333333-3333-3333-3333-333333333326', 'Geeta Sundaram', '+919820011026', 'geeta.s@example.com', 'Matunga, Mumbai', 'Mother'),
  ('33333333-3333-3333-3333-333333333327', 'Pradeep Hegde', '+919820011027', 'pradeep.h@example.com', 'Dombivli, Thane', 'Father'),
  ('33333333-3333-3333-3333-333333333328', 'Archana Somani', '+919820011028', 'archana.s@example.com', 'Vile Parle, Mumbai', 'Mother'),
  ('33333333-3333-3333-3333-333333333329', 'Ashish Pandey', '+919820011029', 'ashish.p@example.com', 'Kurla, Mumbai', 'Father'),
  ('33333333-3333-3333-3333-333333333330', 'Rashmi Chawla', '+919820011030', 'rashmi.c@example.com', 'Prabhadevi, Mumbai', 'Mother')
ON CONFLICT (phone) DO NOTHING;

-- 4. CONSENTS (All opted in except 2 opted out)
INSERT INTO public.consents (guardian_id, channel, status, source)
SELECT id, 'whatsapp', 'opted_in', 'registration'
FROM public.guardians;

-- Mark 2 guardians as opted_out to demonstrate consent check
INSERT INTO public.consents (guardian_id, channel, status, source)
VALUES
  ('33333333-3333-3333-3333-333333333305', 'whatsapp', 'opted_out', 'chat_reply_stop'),
  ('33333333-3333-3333-3333-333333333318', 'whatsapp', 'opted_out', 'manual_toggle');

-- 5. 40 PATIENTS (Siblings share guardians: 3301, 3302, 3304, 3307 each have 2 kids)
INSERT INTO public.patients (id, patient_code, guardian_id, full_name, date_of_birth, gender, blood_group, allergies, medical_notes) VALUES
  ('44444444-4444-4444-4444-444444444401', 'PT-2026-000001', '33333333-3333-3333-3333-333333333301', 'Aarav Sharma', '2021-04-12', 'male', 'B+', ARRAY['Peanuts'], 'Mild childhood asthma'),
  ('44444444-4444-4444-4444-444444444402', 'PT-2026-000002', '33333333-3333-3333-3333-333333333301', 'Ananya Sharma', '2023-09-18', 'female', 'B+', '{}', 'Sibling to Aarav'),
  ('44444444-4444-4444-4444-444444444403', 'PT-2026-000003', '33333333-3333-3333-3333-333333333302', 'Rudra Patel', '2022-01-05', 'male', 'O+', '{}', 'Normal milestone progress'),
  ('44444444-4444-4444-4444-444444444404', 'PT-2026-000004', '33333333-3333-3333-3333-333333333302', 'Diya Patel', '2024-06-20', 'female', 'O+', '{}', 'Infant vaccinations up-to-date'),
  ('44444444-4444-4444-4444-444444444405', 'PT-2026-000005', '33333333-3333-3333-3333-333333333303', 'Vihaan Verma', '2019-11-10', 'male', 'A+', ARRAY['Penicillin'], 'Seasonal allergic rhinitis'),
  ('44444444-4444-4444-4444-444444444406', 'PT-2026-000006', '33333333-3333-3333-3333-333333333304', 'Aditi Kulkarni', '2020-03-25', 'female', 'AB+', '{}', 'Regular wellness checks'),
  ('44444444-4444-4444-4444-444444444407', 'PT-2026-000007', '33333333-3333-3333-3333-333333333304', 'Advait Kulkarni', '2023-12-01', 'male', 'AB+', '{}', 'Sibling checkup'),
  ('44444444-4444-4444-4444-444444444408', 'PT-2026-000008', '33333333-3333-3333-3333-333333333305', 'Kabir Malhotra', '2018-08-14', 'male', 'B-', '{}', 'Active sports kid, prone to scrapes'),
  ('44444444-4444-4444-4444-444444444409', 'PT-2026-000009', '33333333-3333-3333-3333-333333333306', 'Myra Deshmukh', '2021-07-30', 'female', 'O-', '{}', 'Recurrent tonsillitis'),
  ('44444444-4444-4444-4444-444444444410', 'PT-2026-000010', '33333333-3333-3333-3333-333333333307', 'Sai Karthik Iyer', '2020-09-09', 'male', 'A-', '{}', 'Lactose intolerant'),
  ('44444444-4444-4444-4444-444444444411', 'PT-2026-000011', '33333333-3333-3333-3333-333333333307', 'Tara Iyer', '2024-02-14', 'female', 'A+', '{}', 'Newborn follow-up'),
  ('44444444-4444-4444-4444-444444444412', 'PT-2026-000012', '33333333-3333-3333-3333-333333333308', 'Dev Nair', '2019-05-19', 'male', 'O+', '{}', 'Good general health'),
  ('44444444-4444-4444-4444-444444444413', 'PT-2026-000013', '33333333-3333-3333-3333-333333333309', 'Ishaan Gupta', '2022-08-22', 'male', 'B+', ARRAY['Egg'], 'Eczema in winter'),
  ('44444444-4444-4444-4444-444444444414', 'PT-2026-000014', '33333333-3333-3333-3333-333333333310', 'Navya Aggarwal', '2023-04-03', 'female', 'A+', '{}', 'Healthy infant'),
  ('44444444-4444-4444-4444-444444444415', 'PT-2026-000015', '33333333-3333-3333-3333-333333333311', 'Arjun Joshi', '2017-10-15', 'male', 'O+', '{}', 'Pre-school physical passed'),
  ('44444444-4444-4444-4444-444444444416', 'PT-2026-000016', '33333333-3333-3333-3333-333333333312', 'Saanvi Reddy', '2021-12-11', 'female', 'B+', '{}', 'Viral bronchitis history'),
  ('44444444-4444-4444-4444-444444444417', 'PT-2026-000017', '33333333-3333-3333-3333-333333333313', 'Reyansh Saxena', '2020-06-04', 'male', 'AB-', '{}', 'Underweight assessment'),
  ('44444444-4444-4444-4444-444444444418', 'PT-2026-000018', '33333333-3333-3333-3333-333333333314', 'Rhea Menon', '2022-10-28', 'female', 'A-', '{}', 'Routine growth tracking'),
  ('44444444-4444-4444-4444-444444444419', 'PT-2026-000019', '33333333-3333-3333-3333-333333333315', 'Dhruv Sen', '2018-02-17', 'male', 'O+', '{}', 'Asthma inhaler prescribed'),
  ('44444444-4444-4444-4444-444444444420', 'PT-2026-000020', '33333333-3333-3333-3333-333333333316', 'Pari Banerjee', '2023-01-19', 'female', 'B+', '{}', 'Teething fever episodes'),
  ('44444444-4444-4444-4444-444444444421', 'PT-2026-000021', '33333333-3333-3333-3333-333333333317', 'Ayaan Chauhan', '2021-08-08', 'male', 'A+', '{}', 'Gastroenteritis resolved'),
  ('44444444-4444-4444-4444-444444444422', 'PT-2026-000022', '33333333-3333-3333-3333-333333333318', 'Kiara Mehta', '2022-03-31', 'female', 'O-', '{}', 'Ear infection follow-up'),
  ('44444444-4444-4444-4444-444444444423', 'PT-2026-000023', '33333333-3333-3333-3333-333333333319', 'Atharv Rao', '2019-01-23', 'male', 'B-', '{}', 'Adenoid hypertrophy'),
  ('44444444-4444-4444-4444-444444444424', 'PT-2026-000024', '33333333-3333-3333-3333-333333333320', 'Ira Pillai', '2024-05-12', 'female', 'AB+', '{}', 'BCG and Polio completed'),
  ('44444444-4444-4444-4444-444444444425', 'PT-2026-000025', '33333333-3333-3333-3333-333333333321', 'Kavish Bhatia', '2020-11-20', 'male', 'O+', '{}', 'Speech therapy referral'),
  ('44444444-4444-4444-4444-444444444426', 'PT-2026-000026', '33333333-3333-3333-3333-333333333322', 'Anika Singhania', '2023-07-07', 'female', 'A+', '{}', 'Normal development'),
  ('44444444-4444-4444-4444-444444444427', 'PT-2026-000027', '33333333-3333-3333-3333-333333333323', 'Madhav Nambiar', '2018-09-05', 'male', 'B+', '{}', 'Tonsils enlarged grade 2'),
  ('44444444-4444-4444-4444-444444444428', 'PT-2026-000028', '33333333-3333-3333-3333-333333333324', 'Zoya Kapoor', '2021-02-14', 'female', 'O+', '{}', 'High fever convulsion in 2023'),
  ('44444444-4444-4444-4444-444444444429', 'PT-2026-000029', '33333333-3333-3333-3333-333333333325', 'Samarth Tiwari', '2022-12-05', 'male', 'A-', '{}', 'Colic symptoms managed'),
  ('44444444-4444-4444-4444-444444444430', 'PT-2026-000030', '33333333-3333-3333-3333-333333333326', 'Shruti Sundaram', '2020-04-18', 'female', 'B-', '{}', 'Allergic bronchitis'),
  ('44444444-4444-4444-4444-444444444431', 'PT-2026-000031', '33333333-3333-3333-3333-333333333327', 'Vivaan Hegde', '2023-08-29', 'male', 'AB+', '{}', 'Weight checkup'),
  ('44444444-4444-4444-4444-444444444432', 'PT-2026-000032', '33333333-3333-3333-3333-333333333328', 'Siya Somani', '2019-07-12', 'female', 'O+', '{}', 'Vision screening done'),
  ('44444444-4444-4444-4444-444444444433', 'PT-2026-000033', '33333333-3333-3333-3333-333333333329', 'Darsh Pandey', '2021-10-02', 'male', 'A+', '{}', 'Chickenpox recovered'),
  ('44444444-4444-4444-4444-444444444434', 'PT-2026-000034', '33333333-3333-3333-3333-333333333330', 'Avni Chawla', '2024-01-22', 'female', 'B+', '{}', 'Well baby visit'),
  ('44444444-4444-4444-4444-444444444435', 'PT-2026-000035', '33333333-3333-3333-3333-333333333303', 'Tanmay Verma', '2023-05-15', 'male', 'A+', '{}', 'Sibling checkup'),
  ('44444444-4444-4444-4444-444444444436', 'PT-2026-000036', '33333333-3333-3333-3333-333333333306', 'Ojas Deshmukh', '2024-03-10', 'male', 'O-', '{}', 'Sibling checkup'),
  ('44444444-4444-4444-4444-444444444437', 'PT-2026-000037', '33333333-3333-3333-3333-333333333308', 'Anvi Nair', '2022-04-16', 'female', 'O+', '{}', 'Sibling checkup'),
  ('44444444-4444-4444-4444-444444444438', 'PT-2026-000038', '33333333-3333-3333-3333-333333333309', 'Aarush Gupta', '2024-07-01', 'male', 'B+', '{}', 'Sibling checkup'),
  ('44444444-4444-4444-4444-444444444439', 'PT-2026-000039', '33333333-3333-3333-3333-333333333311', 'Trisha Joshi', '2021-06-25', 'female', 'O+', '{}', 'Sibling checkup'),
  ('44444444-4444-4444-4444-444444444440', 'PT-2026-000040', '33333333-3333-3333-3333-333333333313', 'Karan Saxena', '2023-11-11', 'male', 'AB-', '{}', 'Sibling checkup')
ON CONFLICT (patient_code) DO NOTHING;

-- 6. GENERATE 120 VISITS (Spanning past 60 days)
INSERT INTO public.visits (patient_id, visit_date, chief_complaint, diagnosis, vitals, prescription, notes)
SELECT
  p.id,
  (NOW() - (v_offset || ' days')::interval + (v_offset * 12 || ' minutes')::interval),
  complaint.c,
  diagnosis.d,
  jsonb_build_object(
    'weight_kg', ROUND((10 + (RANDOM() * 18))::numeric, 1),
    'height_cm', ROUND((75 + (RANDOM() * 45))::numeric, 0),
    'temp_c', ROUND((36.8 + (RANDOM() * 2.2))::numeric, 1),
    'spo2', 98 + FLOOR(RANDOM() * 3)::int,
    'pulse_bpm', 85 + FLOOR(RANDOM() * 35)::int
  ),
  'Syrup Paracetamol 250mg TDS x 3 days, Saline Nasal drops SOS',
  'Advised plenty of warm fluids, rest, and review if high fever persists > 48h.'
FROM public.patients p
CROSS JOIN LATERAL generate_series(1, 3) AS v_offset
CROSS JOIN LATERAL (
  SELECT CASE (v_offset % 5)
    WHEN 0 THEN 'High fever with cold and persistent night cough'
    WHEN 1 THEN 'Vomiting and loose motions since yesterday evening'
    WHEN 2 THEN 'Scheduled 18-month vaccination and weight check'
    WHEN 3 THEN 'Mild wheezing and allergic skin rash'
    ELSE 'Routine pediatric milestone checkup and appetite loss'
  END AS c
) AS complaint
CROSS JOIN LATERAL (
  SELECT CASE (v_offset % 5)
    WHEN 0 THEN 'Acute Upper Respiratory Tract Infection (URTI)'
    WHEN 1 THEN 'Pediatric Acute Gastroenteritis (mild dehydration)'
    WHEN 2 THEN 'Vaccination - DTP Booster administered'
    WHEN 3 THEN 'Allergic Bronchitis with atopic dermatitis'
    ELSE 'Normal developmental milestone review'
  END AS d
) AS diagnosis
LIMIT 120;

-- 7. INVOICES & PAYMENTS (From visits)
INSERT INTO public.invoices (id, invoice_number, visit_id, patient_id, guardian_id, total_amount, discount_amount, tax_amount, net_amount, status, due_date)
SELECT
  ('55555555-' || LPAD(ROW_NUMBER() OVER ()::text, 4, '0') || '-1111-1111-111111111111')::uuid,
  'INV-2026-' || LPAD(ROW_NUMBER() OVER ()::text, 6, '0'),
  v.id,
  v.patient_id,
  p.guardian_id,
  fee.amt,
  0.00,
  0.00,
  fee.amt,
  CASE WHEN (ROW_NUMBER() OVER () % 10 = 0) THEN 'partially_paid'
       WHEN (ROW_NUMBER() OVER () % 12 = 0) THEN 'issued'
       ELSE 'paid' END,
  v.visit_date::date
FROM public.visits v
JOIN public.patients p ON v.patient_id = p.id
CROSS JOIN LATERAL (
  SELECT (CASE WHEN (ROW_NUMBER() OVER () % 3 = 0) THEN 1400.00 ELSE 600.00 END) AS amt
) fee
LIMIT 60;

-- INVOICE ITEMS
INSERT INTO public.invoice_items (invoice_id, service_id, service_name, quantity, unit_price, total_price)
SELECT
  i.id,
  '11111111-1111-1111-1111-111111111101',
  'Pediatric General Consultation',
  1,
  600.00,
  600.00
FROM public.invoices i;

-- PAYMENTS FOR PAID AND PARTIALLY PAID INVOICES
INSERT INTO public.payments (invoice_id, visit_id, amount, payment_method, status, notes)
SELECT
  i.id,
  i.visit_id,
  CASE WHEN i.status = 'partially_paid' THEN i.net_amount / 2 ELSE i.net_amount END,
  CASE (ROW_NUMBER() OVER () % 4)
    WHEN 0 THEN 'upi'
    WHEN 1 THEN 'cash'
    WHEN 2 THEN 'card'
    ELSE 'razorpay'
  END,
  'paid',
  'Payment received at clinic billing counter'
FROM public.invoices i
WHERE i.status IN ('paid', 'partially_paid');

-- 8. APPOINTMENTS (Spread over today, past days, and upcoming week)
INSERT INTO public.appointments (patient_id, doctor_id, appointment_date, start_time, end_time, type, status, reason)
SELECT
  p.id,
  (SELECT id FROM public.profiles LIMIT 1),
  (CURRENT_DATE + ((idx - 5) || ' days')::interval)::date,
  ('09:00:00'::time + ((idx % 8) * INTERVAL '30 minutes')),
  ('09:30:00'::time + ((idx % 8) * INTERVAL '30 minutes')),
  CASE WHEN idx % 2 = 0 THEN 'new' ELSE 'follow_up' END,
  CASE WHEN idx < 5 THEN 'completed'
       WHEN idx = 5 THEN 'confirmed'
       WHEN idx = 6 THEN 'booked'
       WHEN idx = 7 THEN 'no_show'
       ELSE 'booked' END,
  'Pediatric consultation & general health check'
FROM (
  SELECT id, ROW_NUMBER() OVER () AS idx FROM public.patients LIMIT 25
) p
WHERE EXISTS (SELECT 1 FROM public.profiles LIMIT 1);

-- 9. 2 MARKETING CAMPAIGNS & RECIPIENTS
INSERT INTO public.campaigns (id, title, template_id, status, scheduled_at, audience_criteria, total_target, sent_count, delivered_count, read_count, failed_count) VALUES
  ('77777777-1111-1111-1111-111111111101', 'Monsoon Flu Vaccination Drive 2026', '22222222-2222-2222-2222-222222222204', 'completed', NOW() - INTERVAL '3 days', '{"age_min": 1, "age_max": 8, "consent_required": true}'::jsonb, 28, 28, 26, 22, 2),
  ('77777777-1111-1111-1111-111111111102', 'Growth & Nutrition Milestone Camp', '22222222-2222-2222-2222-222222222205', 'scheduled', NOW() + INTERVAL '2 days', '{"visited_within_days": 60, "consent_required": true}'::jsonb, 25, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- CAMPAIGN RECIPIENTS (With UNIQUE(campaign_id, guardian_id) deduplication!)
INSERT INTO public.campaign_recipients (campaign_id, guardian_id, status)
SELECT
  '77777777-1111-1111-1111-111111111101',
  g.id,
  CASE WHEN g.id IN ('33333333-3333-3333-3333-333333333305', '33333333-3333-3333-3333-333333333318')
       THEN 'excluded_no_consent'
       ELSE 'read' END
FROM public.guardians g
ON CONFLICT (campaign_id, guardian_id) DO NOTHING;
