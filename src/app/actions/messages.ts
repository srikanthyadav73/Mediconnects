"use server";

import { revalidatePath } from "next/cache";
import { processDueRemindersJob } from "@/lib/appointment-reminders";
import { retryMessage, getMessagesForAppointment } from "@/lib/messages-store";
import { getCurrentUser } from "@/lib/auth";

export async function runRemindersJobAction() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    // Only admins (or staff) can manually trigger reminder dispatches
    if (!user) {
      return { success: false, error: "Authentication required." };
    }
  }

  try {
    const summary = await processDueRemindersJob(true); // force ignore quiet hours for admin manual run
    revalidatePath("/messages");
    revalidatePath("/appointments");
    revalidatePath("/dashboard");
    return { success: true, summary };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || "Failed to execute reminders job",
    };
  }
}

export async function retryMessageAction(messageId: string) {
  const res = await retryMessage(messageId);
  revalidatePath("/messages");
  revalidatePath("/appointments");
  return res;
}

export async function getAppointmentMessagesAction(appointmentId: string) {
  return await getMessagesForAppointment(appointmentId);
}

