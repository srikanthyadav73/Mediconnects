import { z } from "zod";

const isValidUrl = (val: string | undefined): boolean => {
  if (!val || val === "YOUR_PROJECT_URL") return false;
  try {
    new URL(val);
    return true;
  } catch {
    return false;
  }
};

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const safeSupabaseUrl = isValidUrl(rawSupabaseUrl)
  ? rawSupabaseUrl!
  : "https://mock-project.supabase.co";

const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const safeAnonKey =
  rawAnonKey && rawAnonKey !== "YOUR_PUBLISHABLE_KEY"
    ? rawAnonKey
    : "mock-anon-key-placeholder";

const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const safeServiceKey =
  rawServiceKey && rawServiceKey !== "YOUR_SECRET_KEY"
    ? rawServiceKey
    : "mock-service-role-key-placeholder";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("https://mock-project.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("mock-anon-key-placeholder"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default("mock-service-role-key-placeholder"),

  // Cron / Job security
  CRON_SECRET: z.string().optional().default("carebridge_cron_secret_secure_2026"),

  // WhatsApp Cloud API (optional - mock mode active when missing)
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional().default("carebridge_webhook_verify_token"),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),

  // Razorpay (optional - mock mode active when missing)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // App Base URL
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

const parsedEnv = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: safeSupabaseUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: safeAnonKey,
  SUPABASE_SERVICE_ROLE_KEY: safeServiceKey,
  CRON_SECRET: process.env.CRON_SECRET || "carebridge_cron_secret_secure_2026",
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || "carebridge_webhook_verify_token",
  WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const env = parsedEnv.success ? parsedEnv.data : envSchema.parse({});

export const isSupabaseConfigured = Boolean(
  rawSupabaseUrl &&
    rawSupabaseUrl !== "YOUR_PROJECT_URL" &&
    rawAnonKey &&
    rawAnonKey !== "YOUR_PUBLISHABLE_KEY"
);

export const isWhatsAppMock = !Boolean(
  env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN
);

export const isRazorpayMock = !Boolean(
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
);
