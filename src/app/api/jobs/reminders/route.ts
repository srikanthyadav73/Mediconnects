import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { sendWhatsAppMessage } from "@/lib/messages-store";
import { fetchAllAppointments } from "@/app/actions/appointments";

export async function POST(request: NextRequest) {
  // CRON_SECRET Security Check
  const authHeader = request.headers.get("authorization");
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const expectedSecret = env.CRON_SECRET;

  const isAuthorized =
    authHeader === `Bearer ${expectedSecret}` || cronSecretHeader === expectedSecret;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized: Invalid CRON_SECRET" }, { status: 401 });
  }

  try {
    const appointments = await fetchAllAppointments();
    const now = new Date();

    let sent24h = 0;
    let skipped24h = 0;
    let sent2h = 0;
    let skipped2h = 0;

    // Filter appointments for 24h & 2h reminders
    for (const appt of appointments) {
      if (appt.status === "cancelled" || appt.status === "completed") continue;

      const apptDateTime = new Date(`${appt.appointmentDate}T${appt.startTime}:00`);
      const diffHours = (apptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // 24 Hour window (20h to 26h ahead)
      if (diffHours >= 20 && diffHours <= 26) {
        const res = await sendWhatsAppMessage({
          guardianId: appt.patientId,
          guardianName: appt.guardianName,
          guardianPhone: appt.guardianPhone,
          patientName: appt.patientName,
          templateName: "appointment_reminder_24h",
          parameters: {
            doctor_name: appt.doctorName,
            date: appt.appointmentDate,
            time: appt.startTime,
          },
        });

        if (res.success) {
          sent24h++;
        } else {
          skipped24h++;
        }
      }

      // 2 Hour window (1h to 3h ahead)
      if (diffHours >= 1 && diffHours <= 3) {
        const res = await sendWhatsAppMessage({
          guardianId: appt.patientId,
          guardianName: appt.guardianName,
          guardianPhone: appt.guardianPhone,
          patientName: appt.patientName,
          templateName: "appointment_reminder_2h",
          parameters: {
            doctor_name: appt.doctorName,
            time: appt.startTime,
          },
        });

        if (res.success) {
          sent2h++;
        } else {
          skipped2h++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        reminders24h: { sent: sent24h, skippedOrNoConsent: skipped24h },
        reminders2h: { sent: sent2h, skippedOrNoConsent: skipped2h },
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Cron reminder dispatch error" },
      { status: 500 }
    );
  }
}
