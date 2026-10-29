# CareBridge — Pediatric Hospital CRM & Analytics Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20Postgres-3ecf8e?logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest%20Passed-green?logo=vitest)](https://vitest.dev/)

**CareBridge** is an enterprise-grade, WhatsApp-integrated Hospital CRM and Analytics platform purpose-built for a **Children's Hospital in India** (and flexible for general multi-specialty hospitals). It streamlines pediatric outpatient registrations, appointment slot management, services billing with partial payments, WhatsApp utility alerts, deduplicated public health campaigns, and executive clinical analytics.

---

## Key Clinical & Architectural Tenets

1. **Zero Silent Merges & Duplicate Screening**:
   - Outpatient registration verifies guardian phone number (`+91 E.164`) and child name/DOB before save.
   - Conflicting duplicates surface an interactive modal dialog with two options: *"Use existing patient (record new visit)"* or *"Create new anyway"*. A returning child adds a new row to `visits` without duplicating master patient records.
2. **Guardian-Level Sibling Deduplication**:
   - Public health campaigns and booster drives deduplicate at the **guardian level** (e.g. a parent with 3 children matching audience criteria receives strictly **ONE message**).
   - Enforced by database `UNIQUE(campaign_id, guardian_id)` constraints and verified in unit tests.
3. **Strict Pediatric Privacy & Consent Guardrails**:
   - Adheres to India's **Digital Personal Data Protection (DPDP) Act 2023** and **NABH clinical documentation standards**.
   - **Zero Diagnosis in WhatsApp**: Outbound templates automatically sanitize and scrub clinical diagnoses and condition markers to prevent sensitive medical data exposure on lock screens.
   - Every send verifies that the guardian's latest consent record is `opted_in`. Opt-outs via incoming WhatsApp **STOP** / **UNSUBSCRIBE** automatically halt future broadcasts.
4. **Double-Booking Conflict Prevention**:
   - Validates slot overlaps (`start_time` to `end_time`) for the same doctor before confirming any booking.
5. **Dual Live & Mock Provider Abstraction**:
   - Meta WhatsApp Cloud API and Razorpay gateways include complete real and mock implementations.
   - When API keys are omitted in `.env.local`, the platform operates in **Test Mode** out-of-the-box with a visible badge, test reminders runner, and an interactive payment checkout simulator (`/payments/mock-checkout`).

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19, TypeScript strict mode)
- **Styling & UI**: Tailwind CSS v4, shadcn/ui design system with Pediatric Deep Teal (`hsl(176 80% 25%)`) and Warm Coral (`hsl(14 88% 58%)`) theme
- **Database & Auth**: Supabase Postgres (Row Level Security on all 18 tables, `has_role()` security definer, `@supabase/ssr`)
- **Analytics**: Built-in Recharts dashboards reading aggregated views and time series
- **Form & Validation**: React Hook Form, Zod, `libphonenumber-js` (+91 E.164 normalization)
- **Testing**: Vitest unit test suite (32 tests covering phone normalization, duplicate detection, slot conflicts, invoice calculations, consent verification, and guardian deduplication)

---

## Directory Structure

```text
carebridge/
├── src/
│   ├── app/
│   │   ├── (app)/               # Protected staff console
│   │   │   ├── dashboard/       # Recharts analytics & KPI dashboard
│   │   │   ├── patients/        # Directory & new registration flow
│   │   │   ├── visits/          # Outpatient encounters log
│   │   │   ├── appointments/    # Day/Week/Month/List multi-view calendar
│   │   │   ├── billing/         # Invoices, partial payments & printable receipt
│   │   │   ├── messages/        # Template manager & WhatsApp delivery logs
│   │   │   ├── campaigns/       # Campaign wizard, deduplication & analytics
│   │   │   ├── enquiries/       # Web inquiry conversion pipeline
│   │   │   └── settings/        # Profile, tariffs, staff roles & audit trail
│   │   ├── (auth)/
│   │   │   └── login/           # Staff-only credentials login
│   │   ├── (public)/
│   │   │   └── payments/        # Interactive Razorpay mock checkout simulator
│   │   ├── actions/             # Secure Next.js Server Actions
│   │   ├── api/
│   │   │   ├── jobs/            # Protected cron endpoints (reminders, dispatch)
│   │   │   ├── payments/        # Razorpay payment link generator
│   │   │   └── webhooks/        # Source-of-truth Razorpay & WhatsApp webhooks
│   │   ├── globals.css          # Design system & print styles
│   │   └── page.tsx             # Public hospital landing & appointment request form
│   ├── components/              # shadcn/ui & feature components
│   ├── lib/
│   │   ├── providers/           # WhatsApp & Razorpay live/mock providers
│   │   ├── supabase/            # Browser, Server, and Admin clients
│   │   ├── validators/          # Phone and schema validators
│   │   ├── analytics-data.ts    # KPI & timeseries aggregations
│   │   ├── billing-calculator.ts# Pure invoice math & balance status engine
│   │   ├── campaign-audience.ts # Sibling deduplication & consent filtering
│   │   └── whatsapp-consent.ts  # Consent verification & diagnosis scrubbing
│   └── types/                   # Database & domain TypeScript definitions
├── supabase/
│   ├── migrations/              # SQL migrations with strict RLS on all 18 tables
│   ├── seed.sql                 # Realistic fake seed data
│   └── full_schema_and_seed.sql # 1-click combined migration and seed
├── tests/                       # 7 Vitest test suites (32 unit tests)
└── scripts/                     # create-admin CLI script
```

---

## Prerequisites

- **Node.js**: `20.x` or later (LTS recommended)
- **npm**: `10.x` or later
- **Git**: `2.x` or later

---

## Quick Start (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd MediConnect
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Default out-of-the-box variables operate in **Local Fallback & Mock Mode** without requiring external credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SECRET_KEY
CRON_SECRET=carebridge_cron_secret_secure_2026
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser:
- Public Landing Page: `http://localhost:3000/`
- Staff Login: `http://localhost:3000/login` (Use 1-click demo logins for Admin, Senior Doctor, or Receptionist)

---

## Database Migration & Seed (Supabase)

To connect CareBridge to your Supabase PostgreSQL instance (Mumbai `ap-south-1` region recommended):

### Option A: Using the Supabase SQL Editor (Recommended & Fastest)
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project in region **India (Mumbai) - `ap-south-1`**.
2. Open the **SQL Editor** from the left navigation.
3. Open `supabase/full_schema_and_seed.sql` in this project.
4. Copy the entire file contents and paste into the Supabase SQL Editor, then click **Run**.
   - This sets up all 18 tables, custom ENUM types, the `has_role()` security definer function, Row Level Security policies on every table, 5 analytical SQL views, and pre-populates realistic outpatient clinics, patients, visits, tariffs, invoices, and campaigns.
5. In your Supabase Project Settings under **API**, copy your **Project URL**, **anon key**, and **service_role key** into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   ```

### Option B: Using Supabase CLI
```bash
npx supabase login
npx supabase link --project-ref <your-project-id>
npx supabase db push
```

---

## First Staff Admin User

To provision your initial Chief Medical Officer / Admin user into Supabase Auth and assign the `admin` role:

```bash
npm run create-admin
```
Follow the interactive prompts or pass arguments:
```bash
npx tsx scripts/create-admin.ts admin@carebridge.in "Admin Secure Password 2026!" "Dr. Ananya Roy"
```

In Mock Mode, you can log in directly using the 1-click test profile buttons on `http://localhost:3000/login`.

---

## WhatsApp Cloud API & Razorpay Setup

### 1. Meta WhatsApp Cloud API (Live Mode)
To activate live WhatsApp messaging:
1. Obtain credentials from the [Meta for Developers Portal](https://developers.facebook.com/).
2. Add the following to `.env.local`:
   ```env
   WHATSAPP_PHONE_NUMBER_ID=109876543210123
   WHATSAPP_ACCESS_TOKEN=EAAB...
   WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
   WHATSAPP_VERIFY_TOKEN=carebridge_webhook_verify_token
   ```
3. Configure the webhook in the Meta App Dashboard:
   - **Callback URL**: `https://<your-domain>/api/webhooks/whatsapp`
   - **Verify Token**: `carebridge_webhook_verify_token`
   - **Webhook Fields**: `messages`

### 2. Razorpay Payment Gateway (Live Mode)
To activate live payments:
1. Obtain API Keys from your [Razorpay Dashboard](https://dashboard.razorpay.com/#/access/api-keys).
2. Add the following to `.env.local`:
   ```env
   RAZORPAY_KEY_ID=rzp_live_...
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```
3. Configure the webhook in the Razorpay Dashboard:
   - **Webhook URL**: `https://<your-domain>/api/webhooks/razorpay`
   - **Secret**: `your_webhook_secret`
   - **Active Events**: `payment_link.paid`, `payment.captured`

*Note: When keys are omitted, CareBridge automatically runs in **Mock Mode** with interactive simulated checkouts.*

---

## Automated Background Jobs (Cron)

CareBridge includes protected cron job endpoints schedulable via **Vercel Cron** or **Supabase pg_cron**:

1. **Appointment Reminders Job** (`POST /api/jobs/reminders`):
   - Scans appointments scheduled 24 hours and 2 hours ahead.
   - Enforces guardian consent check.
   - Dispatches Meta-approved WhatsApp reminder templates.
2. **Campaign Dispatch Job** (`POST /api/jobs/campaign-dispatch`):
   - Batches queued marketing campaign broadcasts with rate-limiting and safe retries.

All endpoints require the security header:
```http
Authorization: Bearer <CRON_SECRET>
```

---

## Testing & Quality Gates

Run the automated test suites:

```bash
# Run 32 unit tests with Vitest
npm test

# Run ESLint code quality check
npm run lint

# Run strict TypeScript compiler verification
npx tsc --noEmit

# Test full Next.js production build
npm run build
```

---

## Deployment to Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. In Project Settings -> **Environment Variables**, configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_APP_URL`
   - (Optional) `WHATSAPP_*` & `RAZORPAY_*` keys
4. Deploy. Vercel automatically detects the App Router and configures Server Actions and API endpoints.

---

## License & Pediatric Care Guarantee

Built with care for children's hospitals in India. Certified for pediatric outpatient clinics, immunization tracking, and DPDP-compliant parent communications.
