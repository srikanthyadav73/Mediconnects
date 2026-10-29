"use server";

import { revalidatePath } from "next/cache";
import {
  sendWhatsAppMessage,
  retryMessage,
} from "@/lib/messages-store";
import { env } from "@/lib/env";

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

export async function triggerManualReminderCronAction() {
  try {
    const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${appUrl}/api/jobs/reminders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CRON_SECRET}`,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `Cron trigger failed: ${err}` };
    }

    const data = await res.json();
    revalidatePath("/messages");
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Manual cron trigger error." };
  }
}
