-- Migration: Additive schema for appointment automatic messaging and scheduled queues
-- Date: 2026-11-03

-- 1. Extend public.messages table
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS message_type TEXT CHECK (message_type IN ('appointment_confirmation', 'reminder_evening_before', 'reminder_same_day', 'appointment_cancelled', 'appointment_rescheduled')),
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT,
  ADD COLUMN IF NOT EXISTS skip_reason TEXT,
  ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT;

-- 2. Add Unique Constraint on dedupe_key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_dedupe_key_unique'
  ) THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_dedupe_key_unique UNIQUE (dedupe_key);
  END IF;
END $$;

-- 3. Indexes for appointment and scheduled queries
CREATE INDEX IF NOT EXISTS idx_messages_appointment_id ON public.messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_messages_scheduled_queue ON public.messages(status, scheduled_for) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_messages_dedupe_key ON public.messages(dedupe_key);

-- 4. Seed message templates for automatic appointment messaging
INSERT INTO public.message_templates (id, name, category, language, body_template, variables, approval_status)
VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    'appointment_confirmation',
    'utility',
    'en',
    'Dear {{guardian_name}}, the appointment for {{child_first_name}} with {{doctor_name}} has been confirmed for {{date}} at {{time_slot}}. Hospital address: {{hospital_address}}.',
    ARRAY['guardian_name', 'child_first_name', 'doctor_name', 'date', 'time_slot', 'hospital_address'],
    'approved'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'appointment_reminder',
    'utility',
    'en',
    'Dear {{guardian_name}}, this is a reminder for {{child_first_name}}''s appointment with {{doctor_name}} on {{date}} at {{time_slot}}. Hospital address: {{hospital_address}}.',
    ARRAY['guardian_name', 'child_first_name', 'doctor_name', 'date', 'time_slot', 'hospital_address'],
    'approved'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'appointment_cancelled',
    'utility',
    'en',
    'Dear {{guardian_name}}, the appointment for {{child_first_name}} with {{doctor_name}} scheduled on {{date}} at {{time_slot}} has been cancelled. Hospital address: {{hospital_address}}.',
    ARRAY['guardian_name', 'child_first_name', 'doctor_name', 'date', 'time_slot', 'hospital_address'],
    'approved'
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'appointment_rescheduled',
    'utility',
    'en',
    'Dear {{guardian_name}}, the appointment for {{child_first_name}} with {{doctor_name}} has been rescheduled to {{date}} at {{time_slot}}. Hospital address: {{hospital_address}}.',
    ARRAY['guardian_name', 'child_first_name', 'doctor_name', 'date', 'time_slot', 'hospital_address'],
    'approved'
  )
ON CONFLICT (name) DO UPDATE SET
  body_template = EXCLUDED.body_template,
  variables = EXCLUDED.variables,
  approval_status = 'approved';

