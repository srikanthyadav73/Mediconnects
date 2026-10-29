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
