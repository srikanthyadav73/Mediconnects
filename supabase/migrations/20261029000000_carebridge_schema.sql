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
