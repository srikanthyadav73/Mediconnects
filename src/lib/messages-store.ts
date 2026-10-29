import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { whatsappProvider } from "@/lib/providers/whatsapp";
import {
  type MessageLogEntry,
  APPROVED_TEMPLATES,
} from "@/types/messaging";
import {
  hasValidWhatsAppConsent,
  prepareAndSanitizeWhatsAppMessage,
} from "@/lib/whatsapp-consent";
import type { MessageStatus, ConsentStatus } from "@/types/database";

interface SupabaseMessageRaw {
  id: string;
  guardian_id: string;
  template_id: string | null;
  direction: string | null;
  status: string;
  provider_message_id: string | null;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  guardian: { name: string; phone: string } | null;
}

const inMemoryMessages: MessageLogEntry[] = [
  {
    id: "msg-001",
    guardianId: "33333333-3333-3333-3333-333333333301",
    guardianName: "Rajesh Sharma",
    guardianPhone: "+919820011001",
    patientName: "Aarav Sharma",
    templateName: "appointment_reminder_24h",
    messageBody:
      "Dear Rajesh Sharma, this is a reminder that Aarav Sharma has an appointment with Dr. Ananya Roy tomorrow, 30 Oct at 10:00 AM.",
    status: "read",
    providerMessageId: "wamid.HBgL1698500112233AA",
    isMock: true,
    sentAt: "2026-10-28T09:30:00Z",
    deliveredAt: "2026-10-28T09:30:15Z",
    readAt: "2026-10-28T09:34:02Z",
  },
  {
    id: "msg-002",
    guardianId: "33333333-3333-3333-3333-333333333302",
    guardianName: "Priya Patel",
    guardianPhone: "+919820011002",
    patientName: "Rudra Patel",
    templateName: "appointment_reminder_2h",
    messageBody:
      "Hello Priya Patel, Rudra Patel's appointment with Dr. Rahul Deshpande is in 2 hours at 02:00 PM.",
    status: "delivered",
    providerMessageId: "wamid.HBgL1698500223344BB",
    isMock: true,
    sentAt: "2026-10-28T12:00:00Z",
    deliveredAt: "2026-10-28T12:00:18Z",
  },
  {
    id: "msg-003",
    guardianId: "33333333-3333-3333-3333-333333333305",
    guardianName: "Vikram Malhotra",
    guardianPhone: "+919820011005",
    patientName: "Kabir Malhotra",
    templateName: "medication_reminder",
    messageBody:
      "Friendly reminder for Kabir Malhotra: Please administer prescribed doses of Salbutamol Inhaler as directed. Stay well!",
    status: "sent",
    providerMessageId: "wamid.HBgL1698500334455CC",
    isMock: true,
    sentAt: "2026-10-28T14:15:00Z",
  },
  {
    id: "msg-004",
    guardianId: "33333333-3333-3333-3333-333333333303",
    guardianName: "Amit Verma",
    guardianPhone: "+919820011003",
    patientName: "Meera Verma",
    templateName: "follow_up_visit_notice",
    messageBody:
      "Dear Amit Verma, Dr. Ananya Roy suggested a pediatric review for Meera Verma around 31 Oct.",
    status: "failed",
    providerMessageId: "wamid.HBgL1698500445566DD",
    isMock: true,
    sentAt: "2026-10-28T08:00:00Z",
    errorMessage: "Temporary gateway timeout from carrier. Retry recommended.",
  },
];

export async function fetchAllMessages(): Promise<MessageLogEntry[]> {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          guardian_id,
          template_id,
          direction,
          status,
          provider_message_id,
          error_message,
          created_at,
          sent_at,
          delivered_at,
          read_at,
          guardian:guardians(name, phone)
        `)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const rows = data as unknown as SupabaseMessageRaw[];
        return rows.map((m) => ({
          id: m.id,
          guardianId: m.guardian_id,
          guardianName: m.guardian?.name || "Guardian",
          guardianPhone: m.guardian?.phone || "",
          patientName: "Patient",
          templateName: m.template_id || "template_general",
          messageBody: `WhatsApp Notification (${m.direction || "outbound"})`,
          status: m.status as MessageStatus,
          providerMessageId: m.provider_message_id || "",
          isMock: false,
          sentAt: m.sent_at || m.created_at,
          deliveredAt: m.delivered_at || undefined,
          readAt: m.read_at || undefined,
          errorMessage: m.error_message || undefined,
        }));
      }
    } catch {
      // fallback
    }
  }

  return inMemoryMessages;
}

export async function sendWhatsAppMessage({
  guardianId,
  guardianName,
  guardianPhone,
  patientName,
  templateName,
  parameters = {},
}: {
  guardianId: string;
  guardianName: string;
  guardianPhone: string;
  patientName: string;
  templateName: string;
  parameters?: Record<string, string>;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  // Step 1: CONSENT CHECK
  // "EVERY send first checks the guardian's latest consent is opted_in; otherwise skip and log 'no consent'."
  let hasConsent = true;

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("consents")
        .select("status, created_at")
        .eq("guardian_id", guardianId)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const formatted = data.map((d) => ({
          guardianId,
          status: d.status as ConsentStatus,
          createdAt: d.created_at,
        }));
        hasConsent = hasValidWhatsAppConsent(formatted);
      } else {
        hasConsent = false;
      }
    } catch {
      hasConsent = true; // fallback
    }
  }

  if (!hasConsent) {
    return {
      success: false,
      error: "Skipped: Guardian has no active WhatsApp consent ('opted_out' or unconfirmed).",
    };
  }

  // Step 2: SANITIZE DIAGNOSIS AND CLINICAL TERMS
  const template =
    APPROVED_TEMPLATES.find((t) => t.name === templateName) || APPROVED_TEMPLATES[0];
  const { sanitizedText } = prepareAndSanitizeWhatsAppMessage(
    template.bodyText,
    {
      guardian_name: guardianName,
      patient_name: patientName,
      ...parameters,
    }
  );

  // Step 3: DISPATCH VIA PROVIDER
  const result = await whatsappProvider.sendTemplateMessage(
    guardianPhone,
    templateName,
    {
      guardian_name: guardianName,
      patient_name: patientName,
      ...parameters,
    }
  );

  const newLog: MessageLogEntry = {
    id: `msg-${Date.now()}`,
    guardianId,
    guardianName,
    guardianPhone,
    patientName,
    templateName,
    messageBody: sanitizedText,
    status: result.status,
    providerMessageId: result.messageId,
    isMock: result.isMock,
    sentAt: new Date().toISOString(),
    errorMessage: result.error,
  };

  inMemoryMessages.unshift(newLog);

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      await supabase.from("messages").insert({
        guardian_id: guardianId,
        phone: guardianPhone,
        category: template.category,
        body: sanitizedText,
        status: result.status,
        provider_message_id: result.messageId,
        sent_at: new Date().toISOString(),
        error_message: result.error || null,
      });
    } catch {
      // fallback
    }
  }

  return {
    success: result.success,
    messageId: result.messageId,
    error: result.error,
  };
}

export function updateMessageStatusByProviderId(
  providerMessageId: string,
  newStatus: MessageStatus
) {
  const msg = inMemoryMessages.find((m) => m.providerMessageId === providerMessageId);
  if (msg) {
    msg.status = newStatus;
    if (newStatus === "delivered") msg.deliveredAt = new Date().toISOString();
    if (newStatus === "read") msg.readAt = new Date().toISOString();
  }
}

export async function retryMessage(id: string): Promise<{ success: boolean; error?: string }> {
  const msg = inMemoryMessages.find((m) => m.id === id);
  if (!msg) {
    return { success: false, error: "Message log entry not found." };
  }

  const result = await whatsappProvider.sendTemplateMessage(
    msg.guardianPhone,
    msg.templateName,
    {
      guardian_name: msg.guardianName,
      patient_name: msg.patientName,
    }
  );

  if (result.success) {
    msg.status = "sent";
    msg.errorMessage = undefined;
    msg.providerMessageId = result.messageId;
    msg.sentAt = new Date().toISOString();
    return { success: true };
  } else {
    msg.errorMessage = result.error || "Retry failed";
    return { success: false, error: msg.errorMessage };
  }
}
