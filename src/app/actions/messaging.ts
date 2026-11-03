"use server";

import { revalidatePath } from "next/cache";
import {
  sendWhatsAppMessage,
  retryMessage,
} from "@/lib/messages-store";

export async function sendDirectWhatsAppAction(formData: {
  guardianId: string;
  guardianName: string;
  guardianPhone: string;
  patientName: string;
  templateName: string;
  parameters?: Record<string, string>;
}) {
  try {
    const res = await sendWhatsAppMessage(formData);
    revalidatePath("/messages");
    return res;
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Failed to dispatch message." };
  }
}

export async function retryFailedMessageAction(messageId: string) {
  try {
    const res = await retryMessage(messageId);
    revalidatePath("/messages");
    return res;
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Retry failed." };
  }
}

import { processDueRemindersJob } from "@/lib/appointment-reminders";

export async function triggerManualReminderCronAction() {
  try {
    const summary = await processDueRemindersJob(true);
    revalidatePath("/messages");
    revalidatePath("/appointments");
    return { success: true, data: summary };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Manual cron trigger error." };
  }
}

