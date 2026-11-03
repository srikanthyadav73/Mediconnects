import {
  prepareAndSanitizeWhatsAppMessage,
  hasValidWhatsAppConsent,
  type ConsentRecord,
} from "@/lib/whatsapp-consent";
import {
  type AppointmentMessageSettings,
  getAppointmentMessageSettings,
} from "@/lib/settings-store";
import {
  saveMessageLog,
  getMessagesByDedupeKey,
} from "@/lib/messages-store";
import { whatsappProvider } from "@/lib/providers/whatsapp";
import { APPROVED_TEMPLATES, type MessageType } from "@/types/messaging";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export interface ReminderSchedulePlan {
  messageType: "reminder_same_day" | "reminder_evening_before";
  scheduledForUtc: Date;
  scheduledForIso: string;
  dedupeKey: string;
}

export interface AppointmentContext {
  id: string;
  patientId: string;
  patientName: string;
  guardianName: string;
  guardianPhone: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status?: string;
}

/**
 * Converts an IST date string (YYYY-MM-DD) and time string (HH:mm) into a UTC Date.
 * Asia/Kolkata is strictly UTC+05:30 with no daylight saving time.
 */
export function istToUtc(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map((v) => parseInt(v, 10));
  const timeClean = timeStr.slice(0, 5);
  const [hour, min] = timeClean.split(":").map((v) => parseInt(v, 10));

  // Date.UTC takes month 0-indexed.
  // IST is UTC+5:30, so UTC = IST - 5 hours 30 mins.
  const utcMs = Date.UTC(year, month - 1, day, hour - 5, min - 30, 0, 0);
  return new Date(utcMs);
}

/**
 * Extracts IST calendar date and time parts from a UTC Date.
 */
export function utcToIstParts(utcDate: Date): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  dateStr: string;
  timeStr: string;
} {
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istDate = new Date(utcDate.getTime() + istOffsetMs);

  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth() + 1;
  const day = istDate.getUTCDate();
  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();

  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  const timeStr = `${pad(hours)}:${pad(minutes)}`;

  return { year, month, day, hours, minutes, dateStr, timeStr };
}

/**
 * Formats a YYYY-MM-DD date into friendly IST format (e.g., "29 Oct 2026").
 */
export function formatIstDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
    const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return utcDate.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a 24-hr time (HH:mm) into friendly IST format (e.g., "10:30 AM").
 */
export function formatIstTime(timeStr: string): string {
  const clean = timeStr.slice(0, 5);
  const [hStr, mStr] = clean.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)} ${ampm}`;
}

/**
 * Computes unique dedupe key for an appointment message.
 * dedupe_key = appointment_id + "_" + message_type + "_" + appointment_start_timestamp
 */
export function getAppointmentMessageDedupeKey(
  appointmentId: string,
  messageType: MessageType,
  appointmentDate: string,
  startTime: string
): string {
  const slotIso = `${appointmentDate}T${startTime.slice(0, 5)}:00`;
  return `${appointmentId}_${messageType}_${slotIso}`;
}

/**
 * Calculates reminder schedule for an appointment based on business rules and settings.
 *
 * Rules:
 * a) Same-day reminder:
 *    - slot before 10:00 -> 07:00 that day
 *    - slot 10:00 to 13:00 -> 07:30
 *    - later -> slot time minus 2.5 hours (never earlier than 07:00)
 * b) Evening-before reminder at 18:00 the day before, only if approval happens before that time.
 * c) Skip any reminder whose scheduled time has already passed at approval time.
 * d) Quiet hours: reminders are never sent between 21:00 and 07:00.
 */
export function calculateReminderSchedule(params: {
  appointmentId: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  approvalTimeUtc?: Date;
  settings?: AppointmentMessageSettings;
}): ReminderSchedulePlan[] {
  const {
    appointmentId,
    appointmentDate,
    startTime,
    approvalTimeUtc = new Date(),
    settings,
  } = params;

  const plans: ReminderSchedulePlan[] = [];

  const autoMessagesEnabled = settings?.autoMessagesEnabled ?? true;
  if (!autoMessagesEnabled) {
    return plans;
  }

  const [slotHour, slotMin] = startTime
    .slice(0, 5)
    .split(":")
    .map((v) => parseInt(v, 10));

  // --- 1. SAME-DAY REMINDER ---
  const sameDayEnabled = settings?.sameDayReminderEnabled ?? true;
  if (sameDayEnabled) {
    let reminderHour = 7;
    let reminderMin = 0;

    if (slotHour < 10) {
      reminderHour = 7;
      reminderMin = 0;
    } else if (slotHour < 13 || (slotHour === 13 && slotMin === 0)) {
      reminderHour = 7;
      reminderMin = 30;
    } else {
      // Slot strictly after 13:00 -> slot time minus 2.5 hours (150 minutes)
      const slotTotalMins = slotHour * 60 + slotMin;
      let targetMins = slotTotalMins - 150;
      // Never earlier than 07:00
      if (targetMins < 7 * 60) {
        targetMins = 7 * 60;
      }
      reminderHour = Math.floor(targetMins / 60);
      reminderMin = targetMins % 60;
    }

    const pad = (n: number) => n.toString().padStart(2, "0");
    const sameDayTimeStr = `${pad(reminderHour)}:${pad(reminderMin)}`;
    const sameDayUtc = istToUtc(appointmentDate, sameDayTimeStr);

    // Rule c: Skip if scheduled time has already passed at approval time
    if (sameDayUtc.getTime() > approvalTimeUtc.getTime()) {
      plans.push({
        messageType: "reminder_same_day",
        scheduledForUtc: sameDayUtc,
        scheduledForIso: sameDayUtc.toISOString(),
        dedupeKey: getAppointmentMessageDedupeKey(
          appointmentId,
          "reminder_same_day",
          appointmentDate,
          startTime
        ),
      });
    }
  }

  // --- 2. EVENING-BEFORE REMINDER ---
  const eveningBeforeEnabled = settings?.eveningBeforeReminderEnabled ?? true;
  if (eveningBeforeEnabled) {
    const eveningTime = settings?.eveningReminderTime || "18:00";
    const [evHour, evMin] = eveningTime
      .slice(0, 5)
      .split(":")
      .map((v) => parseInt(v, 10));

    // Calendar day before appointmentDate
    const [y, m, d] = appointmentDate.split("-").map((v) => parseInt(v, 10));
    const apptIstDayUtc = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    apptIstDayUtc.setUTCDate(apptIstDayUtc.getUTCDate() - 1);

    const prevYear = apptIstDayUtc.getUTCFullYear();
    const prevMonth = apptIstDayUtc.getUTCMonth() + 1;
    const prevDay = apptIstDayUtc.getUTCDate();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const prevDateStr = `${prevYear}-${pad(prevMonth)}-${pad(prevDay)}`;
    const eveningTimeStr = `${pad(evHour)}:${pad(evMin)}`;

    const eveningBeforeUtc = istToUtc(prevDateStr, eveningTimeStr);

    // Rule b & c: Only if approval happens before 18:00 the day before
    if (approvalTimeUtc.getTime() < eveningBeforeUtc.getTime()) {
      plans.push({
        messageType: "reminder_evening_before",
        scheduledForUtc: eveningBeforeUtc,
        scheduledForIso: eveningBeforeUtc.toISOString(),
        dedupeKey: getAppointmentMessageDedupeKey(
          appointmentId,
          "reminder_evening_before",
          appointmentDate,
          startTime
        ),
      });
    }
  }

  return plans;
}

/**
 * Builds template parameters strictly restricted to allowed variables:
 * guardian_name, child_first_name, doctor_name, date, time_slot, hospital_address.
 * NEVER includes diagnosis, symptoms, or medications.
 */
export function buildAllowedTemplateVariables(
  appointment: AppointmentContext,
  hospitalAddress: string
): Record<string, string> {
  const childFirst = appointment.patientName.trim().split(/\s+/)[0] || "Child";
  const dateFormatted = formatIstDate(appointment.appointmentDate);
  const timeSlot = `${formatIstTime(appointment.startTime)} - ${formatIstTime(appointment.endTime)}`;

  return {
    guardian_name: appointment.guardianName || "Parent",
    child_first_name: childFirst,
    doctor_name: appointment.doctorName || "Pediatrician",
    date: dateFormatted,
    time_slot: timeSlot,
    hospital_address: hospitalAddress,
  };
}

/**
 * Checks guardian's latest consent status.
 */
export async function checkGuardianConsent(
  guardianId: string,
  guardianPhone?: string
): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("consents")
        .select("status, created_at")
        .eq("guardian_id", guardianId)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const records = data.map((d) => ({
          guardianId,
          status: d.status,
          createdAt: d.created_at,
        })) as ConsentRecord[];
        return hasValidWhatsAppConsent(records);
      }
      return false;
    } catch {
      return true; // Fallback in case of temporary network issue
    }
  }

  // Fallback in mock mode: phone ending with "999" or explicitly opted-out mocked cases
  if (guardianPhone?.endsWith("999")) {
    return false;
  }
  return true;
}

/**
 * Sends or queues an immediate appointment message (confirmation, rescheduled, or cancelled).
 * Catches all provider errors so WhatsApp failure never rolls back the caller's transaction.
 */
export async function sendAppointmentImmediateMessage(params: {
  appointment: AppointmentContext;
  messageType: "appointment_confirmation" | "appointment_rescheduled" | "appointment_cancelled";
  settings?: AppointmentMessageSettings;
}): Promise<{ success: boolean; skipReason?: string; error?: string; dedupeKey: string }> {
  const { appointment, messageType } = params;
  const settings = params.settings || (await getAppointmentMessageSettings());

  const dedupeKey = getAppointmentMessageDedupeKey(
    appointment.id,
    messageType,
    appointment.appointmentDate,
    appointment.startTime
  );

  // Check if already processed (idempotency)
  const existing = await getMessagesByDedupeKey(dedupeKey);
  if (existing) {
    return {
      success: existing.status !== "failed",
      skipReason: existing.skipReason || undefined,
      dedupeKey,
    };
  }

  const template =
    APPROVED_TEMPLATES.find((t) => t.name === messageType) ||
    APPROVED_TEMPLATES.find((t) => t.name === "appointment_confirmation")!;

  const variables = buildAllowedTemplateVariables(
    appointment,
    settings.hospitalAddress
  );

  const { sanitizedText } = prepareAndSanitizeWhatsAppMessage(
    template.bodyText,
    variables
  );

  // Consent Check
  const hasConsent = await checkGuardianConsent(
    appointment.patientId,
    appointment.guardianPhone
  );

  if (!hasConsent) {
    // Record as skipped with skip_reason = 'no_consent'
    await saveMessageLog({
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      guardianId: appointment.patientId,
      guardianName: appointment.guardianName,
      guardianPhone: appointment.guardianPhone,
      patientName: appointment.patientName,
      templateName: template.name,
      messageBody: sanitizedText,
      status: "failed",
      sentAt: new Date().toISOString(),
      appointmentId: appointment.id,
      messageType,
      dedupeKey,
      skipReason: "no_consent",
      attempts: 0,
      lastError: "Guardian has not opted in to WhatsApp updates.",
      errorMessage: "Not sent: no consent",
      isMock: true,
    });

    return {
      success: false,
      skipReason: "no_consent",
      error: "Guardian has not opted in to WhatsApp updates.",
      dedupeKey,
    };
  }

  // Dispatch via provider
  try {
    const result = await whatsappProvider.sendTemplateMessage(
      appointment.guardianPhone,
      template.name,
      variables
    );

    await saveMessageLog({
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      guardianId: appointment.patientId,
      guardianName: appointment.guardianName,
      guardianPhone: appointment.guardianPhone,
      patientName: appointment.patientName,
      templateName: template.name,
      messageBody: sanitizedText,
      status: result.status,
      providerMessageId: result.messageId,
      sentAt: new Date().toISOString(),
      appointmentId: appointment.id,
      messageType,
      dedupeKey,
      attempts: 1,
      lastError: result.error || null,
      errorMessage: result.error,
      isMock: result.isMock,
    });

    return {
      success: result.success,
      error: result.error,
      dedupeKey,
    };
  } catch (err: unknown) {
    const errMsg = (err as Error).message || "WhatsApp dispatch error";
    await saveMessageLog({
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      guardianId: appointment.patientId,
      guardianName: appointment.guardianName,
      guardianPhone: appointment.guardianPhone,
      patientName: appointment.patientName,
      templateName: template.name,
      messageBody: sanitizedText,
      status: "failed",
      sentAt: new Date().toISOString(),
      appointmentId: appointment.id,
      messageType,
      dedupeKey,
      attempts: 1,
      lastError: errMsg,
      errorMessage: errMsg,
      isMock: true,
    });

    return {
      success: false,
      error: errMsg,
      dedupeKey,
    };
  }
}

/**
 * Enqueues upcoming reminders for an appointment according to the calculated schedule.
 */
export async function queueAppointmentReminders(params: {
  appointment: AppointmentContext;
  approvalTimeUtc?: Date;
  settings?: AppointmentMessageSettings;
}): Promise<ReminderSchedulePlan[]> {
  const { appointment, approvalTimeUtc = new Date() } = params;
  const settings = params.settings || (await getAppointmentMessageSettings());

  const plans = calculateReminderSchedule({
    appointmentId: appointment.id,
    appointmentDate: appointment.appointmentDate,
    startTime: appointment.startTime,
    approvalTimeUtc,
    settings,
  });

  const template =
    APPROVED_TEMPLATES.find((t) => t.name === "appointment_reminder") ||
    APPROVED_TEMPLATES[0];

  const variables = buildAllowedTemplateVariables(
    appointment,
    settings.hospitalAddress
  );

  const { sanitizedText } = prepareAndSanitizeWhatsAppMessage(
    template.bodyText,
    variables
  );

  for (const plan of plans) {
    const existing = await getMessagesByDedupeKey(plan.dedupeKey);
    if (!existing) {
      await saveMessageLog({
        id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        guardianId: appointment.patientId,
        guardianName: appointment.guardianName,
        guardianPhone: appointment.guardianPhone,
        patientName: appointment.patientName,
        templateName: template.name,
        messageBody: sanitizedText,
        status: "queued",
        scheduledFor: plan.scheduledForIso,
        appointmentId: appointment.id,
        messageType: plan.messageType,
        dedupeKey: plan.dedupeKey,
        attempts: 0,
        isMock: true,
      });
    }
  }

  return plans;
}

/**
 * Background worker job: finds due queued messages and dispatches them with retry backoff.
 */
export async function processDueRemindersJob(force = false): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  quietHoursActive?: boolean;
}> {
  const now = new Date();
  const istNow = utcToIstParts(now);

  // Check quiet hours: 21:00 to 07:00 IST
  const isQuietHours = istNow.hours >= 21 || istNow.hours < 7;
  if (isQuietHours && !force) {
    return {
      processed: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      quietHoursActive: true,
    };
  }

  const { getPendingScheduledMessages, updateMessageLog } = await import("@/lib/messages-store");
  const { fetchAllAppointments } = await import("@/app/actions/appointments");

  const pending = await getPendingScheduledMessages(now);
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const appointments = await fetchAllAppointments();

  for (const msg of pending) {
    const attempts = (msg.attempts || 0) + 1;

    // 1. Max retry backoff check
    if (attempts > 3) {
      await updateMessageLog(msg.id, {
        status: "failed",
        lastError: "Exceeded maximum 3 retry attempts",
        errorMessage: "Exceeded maximum 3 retry attempts",
        attempts,
      });
      failed++;
      continue;
    }

    // 2. Appointment validity check: must still be confirmed
    if (msg.appointmentId) {
      const appt = appointments.find((a) => a.id === msg.appointmentId);
      if (!appt || appt.status !== "confirmed") {
        await updateMessageLog(msg.id, {
          status: "failed",
          skipReason: "appointment_not_confirmed",
          errorMessage: "Appointment cancelled or not in confirmed state",
          attempts,
        });
        skipped++;
        continue;
      }
    }

    // 3. Consent check before EVERY send
    const hasConsent = await checkGuardianConsent(msg.guardianId, msg.guardianPhone);
    if (!hasConsent) {
      await updateMessageLog(msg.id, {
        status: "failed",
        skipReason: "no_consent",
        lastError: "Guardian consent revoked or unverified",
        errorMessage: "Not sent: no consent",
        attempts,
      });
      skipped++;
      continue;
    }

    // 4. Send via provider
    try {
      const res = await whatsappProvider.sendTemplateMessage(
        msg.guardianPhone,
        msg.templateName,
        {
          guardian_name: msg.guardianName,
          child_first_name: msg.patientName.split(/\s+/)[0] || "Child",
        }
      );

      if (res.success) {
        await updateMessageLog(msg.id, {
          status: "sent",
          sentAt: new Date().toISOString(),
          providerMessageId: res.messageId,
          lastError: undefined,
          errorMessage: undefined,
          attempts,
        });
        sent++;
      } else {
        const isTerminal = attempts >= 3;
        await updateMessageLog(msg.id, {
          status: isTerminal ? "failed" : "queued",
          lastError: res.error,
          errorMessage: res.error,
          attempts,
        });
        failed++;
      }
    } catch (err: unknown) {
      const errMsg = (err as Error).message || "WhatsApp dispatch error";
      const isTerminal = attempts >= 3;
      await updateMessageLog(msg.id, {
        status: isTerminal ? "failed" : "queued",
        lastError: errMsg,
        errorMessage: errMsg,
        attempts,
      });
      failed++;
    }
  }

  return {
    processed: pending.length,
    sent,
    skipped,
    failed,
    quietHoursActive: isQuietHours,
  };
}
