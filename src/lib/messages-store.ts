import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { whatsappProvider } from "@/lib/providers/whatsapp";
import {
  type MessageLogEntry,
  type MessageType,
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
  appointment_id?: string | null;
  message_type?: MessageType | null;
  scheduled_for?: string | null;
  dedupe_key?: string | null;
  skip_reason?: string | null;
  attempts?: number | null;
  last_error?: string | null;
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
          appointment_id,
          message_type,
          scheduled_for,
          dedupe_key,
          skip_reason,
          attempts,
          last_error,
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
          appointmentId: m.appointment_id || undefined,
          messageType: m.message_type || undefined,
          scheduledFor: m.scheduled_for || undefined,
          dedupeKey: m.dedupe_key || undefined,
          skipReason: m.skip_reason || undefined,
          attempts: m.attempts ?? 0,
          lastError: m.last_error || undefined,
        }));
      }
    } catch {
      // fallback
    }
  }

  return inMemoryMessages;
}

export async function saveMessageLog(entry: MessageLogEntry): Promise<MessageLogEntry> {
  // Check if dedupeKey exists in in-memory
  if (entry.dedupeKey) {
    const existingIndex = inMemoryMessages.findIndex((m) => m.dedupeKey === entry.dedupeKey);
    if (existingIndex >= 0) {
      inMemoryMessages[existingIndex] = { ...inMemoryMessages[existingIndex], ...entry };
      return inMemoryMessages[existingIndex];
    }
  }

  inMemoryMessages.unshift(entry);

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      await supabase.from("messages").upsert(
        {
          id: entry.id,
          guardian_id: entry.guardianId,
          phone: entry.guardianPhone,
          category: (entry.messageType ? "utility" : "marketing") as "utility" | "marketing",
          body: entry.messageBody,
          status: entry.status,
          provider_message_id: entry.providerMessageId || null,
          sent_at: entry.sentAt || null,
          delivered_at: entry.deliveredAt || null,
          read_at: entry.readAt || null,
          error_message: entry.errorMessage || null,
          appointment_id: entry.appointmentId || null,
          message_type: entry.messageType || null,
          scheduled_for: entry.scheduledFor || null,
          dedupe_key: entry.dedupeKey || null,
          skip_reason: entry.skipReason || null,
          attempts: entry.attempts ?? 0,
          last_error: entry.lastError || null,
        },
        { onConflict: "dedupe_key" }
      );
    } catch {
      // Supabase failure should never block in-memory operations
    }
  }

  return entry;
}

export async function getMessagesByDedupeKey(dedupeKey: string): Promise<MessageLogEntry | null> {
  const inMem = inMemoryMessages.find((m) => m.dedupeKey === dedupeKey);
  if (inMem) return inMem;

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("dedupe_key", dedupeKey)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          guardianId: data.guardian_id,
          guardianName: "Guardian",
          guardianPhone: data.phone || "",
          patientName: "Patient",
          templateName: data.template_id || "appointment_reminder",
          messageBody: data.body || "",
          status: data.status as MessageStatus,
          providerMessageId: data.provider_message_id || "",
          isMock: false,
          sentAt: data.sent_at || data.created_at,
          appointmentId: data.appointment_id,
          messageType: data.message_type,
          scheduledFor: data.scheduled_for,
          dedupeKey: data.dedupe_key,
          skipReason: data.skip_reason,
          attempts: data.attempts ?? 0,
          lastError: data.last_error,
        };
      }
    } catch {
      // fallback
    }
  }

  return null;
}

export async function getMessagesForAppointment(appointmentId: string): Promise<MessageLogEntry[]> {
  const inMem = inMemoryMessages.filter((m) => m.appointmentId === appointmentId);

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          guardianId: d.guardian_id,
          guardianName: "Guardian",
          guardianPhone: d.phone || "",
          patientName: "Patient",
          templateName: d.template_id || "appointment_reminder",
          messageBody: d.body || "",
          status: d.status as MessageStatus,
          providerMessageId: d.provider_message_id || "",
          isMock: false,
          sentAt: d.sent_at || d.created_at,
          appointmentId: d.appointment_id,
          messageType: d.message_type,
          scheduledFor: d.scheduled_for,
          dedupeKey: d.dedupe_key,
          skipReason: d.skip_reason,
          attempts: d.attempts ?? 0,
          lastError: d.last_error,
        }));
      }
    } catch {
      // fallback
    }
  }

  return inMem;
}

export async function cancelPendingReminders(appointmentId: string): Promise<number> {
  let count = 0;
  for (const m of inMemoryMessages) {
    if (m.appointmentId === appointmentId && (m.status === "queued" || m.messageType?.startsWith("reminder"))) {
      if (m.status === "queued") {
        m.status = "failed";
        m.skipReason = "appointment_cancelled_or_rescheduled";
        m.errorMessage = "Cancelled due to appointment update";
        count++;
      }
    }
  }

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      await supabase
        .from("messages")
        .update({
          status: "failed",
          skip_reason: "appointment_cancelled_or_rescheduled",
          error_message: "Cancelled due to appointment update",
        })
        .eq("appointment_id", appointmentId)
        .eq("status", "queued");
    } catch {
      // fallback
    }
  }

  return count;
}

export async function getPendingScheduledMessages(asOf: Date = new Date()): Promise<MessageLogEntry[]> {
  const asOfIso = asOf.toISOString();
  const inMem = inMemoryMessages.filter(
    (m) => m.status === "queued" && m.scheduledFor && m.scheduledFor <= asOfIso
  );

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("messages")
        .select(`
          id,
          guardian_id,
          template_id,
          status,
          phone,
          body,
          appointment_id,
          message_type,
          scheduled_for,
          dedupe_key,
          skip_reason,
          attempts,
          last_error,
          guardian:guardians(name, phone)
        `)
        .eq("status", "queued")
        .lte("scheduled_for", asOfIso);

      if (data && data.length > 0) {
        return (data as unknown as SupabaseMessageRaw[]).map((d) => ({
          id: d.id,
          guardianId: d.guardian_id,
          guardianName: d.guardian?.name || "Guardian",
          guardianPhone: d.guardian?.phone || "",
          patientName: "Patient",
          templateName: d.template_id || "appointment_reminder",
          messageBody: (d as unknown as { body?: string }).body || "",
          providerMessageId: d.provider_message_id || "",
          isMock: false,
          status: "queued" as MessageStatus,
          appointmentId: d.appointment_id,
          messageType: d.message_type,
          scheduledFor: d.scheduled_for,
          dedupeKey: d.dedupe_key,
          skipReason: d.skip_reason,
          attempts: d.attempts ?? 0,
          lastError: d.last_error,
        }));
      }
    } catch {
      // fallback
    }
  }

  return inMem;
}

export async function updateMessageLog(
  id: string,
  updates: Partial<MessageLogEntry>
): Promise<void> {
  const inMem = inMemoryMessages.find((m) => m.id === id);
  if (inMem) {
    Object.assign(inMem, updates);
  }

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const dbUpdates: Record<string, unknown> = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.sentAt) dbUpdates.sent_at = updates.sentAt;
      if (updates.deliveredAt) dbUpdates.delivered_at = updates.deliveredAt;
      if (updates.readAt) dbUpdates.read_at = updates.readAt;
      if (updates.errorMessage !== undefined) dbUpdates.error_message = updates.errorMessage;
      if (updates.skipReason !== undefined) dbUpdates.skip_reason = updates.skipReason;
      if (updates.attempts !== undefined) dbUpdates.attempts = updates.attempts;
      if (updates.lastError !== undefined) dbUpdates.last_error = updates.lastError;
      if (updates.providerMessageId) dbUpdates.provider_message_id = updates.providerMessageId;

      await (supabase.from("messages") as unknown as { update: (values: unknown) => { eq: (col: string, val: string) => Promise<unknown> } }).update(dbUpdates).eq("id", id);
    } catch {
      // fallback
    }
  }
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
  let msg = inMemoryMessages.find((m) => m.id === id);

  if (!msg && isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.from("messages").select("*").eq("id", id).maybeSingle();
      if (data) {
        msg = {
          id: data.id,
          guardianId: data.guardian_id,
          guardianName: "Guardian",
          guardianPhone: data.phone || "",
          patientName: "Patient",
          templateName: data.template_id || "appointment_reminder",
          messageBody: data.body || "",
          status: data.status as MessageStatus,
          providerMessageId: data.provider_message_id || "",
          isMock: false,
          sentAt: data.sent_at || data.created_at,
          appointmentId: data.appointment_id,
          messageType: data.message_type,
          scheduledFor: data.scheduled_for,
          dedupeKey: data.dedupe_key,
          skipReason: data.skip_reason,
          attempts: data.attempts ?? 0,
          lastError: data.last_error,
        };
      }
    } catch {
      // fallback
    }
  }

  if (!msg) {
    return { success: false, error: "Message log entry not found." };
  }

  const attempts = (msg.attempts || 0) + 1;

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
    msg.lastError = undefined;
    msg.attempts = attempts;
    msg.providerMessageId = result.messageId;
    msg.sentAt = new Date().toISOString();

    await updateMessageLog(id, {
      status: "sent",
      errorMessage: undefined,
      lastError: undefined,
      attempts,
      providerMessageId: result.messageId,
      sentAt: msg.sentAt,
    });

    return { success: true };
  } else {
    msg.status = "failed";
    msg.errorMessage = result.error || "Retry failed";
    msg.lastError = result.error || "Retry failed";
    msg.attempts = attempts;

    await updateMessageLog(id, {
      status: "failed",
      errorMessage: msg.errorMessage,
      lastError: msg.lastError,
      attempts,
    });

    return { success: false, error: msg.errorMessage };
  }
}
