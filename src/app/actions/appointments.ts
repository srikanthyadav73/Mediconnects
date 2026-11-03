"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  checkSlotConflict,
  type ExistingAppointmentSlot,
} from "@/lib/appointment-conflict";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";

export interface AppointmentRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  guardianName: string;
  guardianPhone: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: "new" | "follow_up" | "camp";
  status: "booked" | "confirmed" | "completed" | "cancelled" | "no_show";
  reason: string | null;
  createdAt: string;
}

// In-memory appointments list initialized with realistic outpatient slots
const inMemoryAppointments: AppointmentRecord[] = [
  {
    id: "apt-001",
    patientId: "44444444-4444-4444-4444-444444444401",
    patientName: "Aarav Sharma",
    patientCode: "PT-2026-000001",
    guardianName: "Rajesh Sharma",
    guardianPhone: "+919820011001",
    doctorId: "doc-1",
    doctorName: "Dr. Ananya Roy",
    appointmentDate: "2026-10-29",
    startTime: "10:00",
    endTime: "10:30",
    type: "new",
    status: "confirmed",
    reason: "Acute wheezing, dry cough, and mild fever",
    createdAt: "2026-10-28T09:00:00Z",
  },
  {
    id: "apt-002",
    patientId: "44444444-4444-4444-4444-444444444403",
    patientName: "Rudra Patel",
    patientCode: "PT-2026-000003",
    guardianName: "Priya Patel",
    guardianPhone: "+919820011002",
    doctorId: "doc-2",
    doctorName: "Dr. Rahul Deshpande",
    appointmentDate: "2026-10-29",
    startTime: "11:00",
    endTime: "11:30",
    type: "new",
    status: "completed",
    reason: "Scheduled MMR / DTP Booster Vaccination",
    createdAt: "2026-10-28T10:30:00Z",
  },
  {
    id: "apt-003",
    patientId: "44444444-4444-4444-4444-444444444405",
    patientName: "Vihaan Verma",
    patientCode: "PT-2026-000005",
    guardianName: "Amitabh Verma",
    guardianPhone: "+919820011003",
    doctorId: "doc-1",
    doctorName: "Dr. Ananya Roy",
    appointmentDate: "2026-10-29",
    startTime: "11:30",
    endTime: "12:00",
    type: "new",
    status: "booked",
    reason: "High fever 39°C with sore throat review",
    createdAt: "2026-10-29T07:45:00Z",
  },
  {
    id: "apt-004",
    patientId: "44444444-4444-4444-4444-444444444408",
    patientName: "Kabir Malhotra",
    patientCode: "PT-2026-000008",
    guardianName: "Vikram Malhotra",
    guardianPhone: "+919820011005",
    doctorId: "doc-4",
    doctorName: "Dr. Tanvi Shah",
    appointmentDate: "2026-10-30",
    startTime: "14:00",
    endTime: "14:30",
    type: "follow_up",
    status: "confirmed",
    reason: "Right ankle swelling progress check",
    createdAt: "2026-10-28T14:00:00Z",
  },
  {
    id: "apt-005",
    patientId: "44444444-4444-4444-4444-444444444402",
    patientName: "Ananya Sharma",
    patientCode: "PT-2026-000002",
    guardianName: "Rajesh Sharma",
    guardianPhone: "+919820011001",
    doctorId: "doc-3",
    doctorName: "Dr. Meenakshi Sundaram",
    appointmentDate: "2026-10-31",
    startTime: "10:30",
    endTime: "11:00",
    type: "new",
    status: "booked",
    reason: "Teething fever & sleep regression assessment",
    createdAt: "2026-10-29T08:30:00Z",
  },
];

interface SupabaseAppointmentQueryRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  type: "new" | "follow_up" | "camp";
  status: "booked" | "confirmed" | "completed" | "cancelled" | "no_show";
  reason: string | null;
  created_at: string;
  patient: {
    full_name: string;
    patient_code: string;
    guardian: { name: string; phone: string } | null;
  } | null;
  doctor: { full_name: string } | null;
}

export async function fetchAllAppointments(): Promise<AppointmentRecord[]> {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          patient_id,
          doctor_id,
          appointment_date,
          start_time,
          end_time,
          type,
          status,
          reason,
          created_at,
          patient:patients(
            full_name,
            patient_code,
            guardian:guardians(name, phone)
          ),
          doctor:profiles(full_name)
        `)
        .order("appointment_date", { ascending: true });

      if (!error && data && data.length > 0) {
        const rows = data as unknown as SupabaseAppointmentQueryRow[];
        return rows.map((a) => ({
          id: a.id,
          patientId: a.patient_id,
          patientName: a.patient?.full_name || "Patient",
          patientCode: a.patient?.patient_code || "PT-2026-000000",
          guardianName: a.patient?.guardian?.name || "Guardian",
          guardianPhone: a.patient?.guardian?.phone || "",
          doctorId: a.doctor_id,
          doctorName: a.doctor?.full_name || "Pediatrician",
          appointmentDate: a.appointment_date,
          startTime: a.start_time.slice(0, 5),
          endTime: a.end_time.slice(0, 5),
          type: a.type,
          status: a.status,
          reason: a.reason,
          createdAt: a.created_at,
        }));
      }
    } catch {
      // fallback
    }
  }

  return inMemoryAppointments;
}

const bookSchema = z.object({
  patientId: z.string().min(1, "Please select a patient"),
  patientName: z.string().min(1),
  patientCode: z.string().default("PT-2026-000001"),
  guardianName: z.string().default("Guardian"),
  guardianPhone: z.string().default("+919820011001"),
  doctorId: z.string().min(1, "Please select an attending doctor"),
  doctorName: z.string().min(1),
  appointmentDate: z.string().min(1, "Please choose a date"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  type: z.enum(["new", "follow_up", "camp"]),
  reason: z.string().optional().or(z.literal("")),
});

export async function bookAppointmentAction(data: z.infer<typeof bookSchema>) {
  const parsed = bookSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid appointment data",
    };
  }

  const existing = await fetchAllAppointments();
  const existingSlots: ExistingAppointmentSlot[] = existing.map((a) => ({
    id: a.id,
    doctorId: a.doctorId,
    doctorName: a.doctorName,
    appointmentDate: a.appointmentDate,
    startTime: a.startTime,
    endTime: a.endTime,
    status: a.status,
  }));

  // 1. CHECK FOR DOUBLE BOOKING CONFLICT
  const conflictResult = checkSlotConflict(
    {
      doctorId: parsed.data.doctorId,
      appointmentDate: parsed.data.appointmentDate,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
    },
    existingSlots
  );

  if (conflictResult.hasConflict) {
    return {
      success: false,
      error: `Conflict: ${parsed.data.doctorName} is already booked on ${parsed.data.appointmentDate} during ${parsed.data.startTime} - ${parsed.data.endTime}. Please select another slot or doctor.`,
    };
  }

  const newAppointment: AppointmentRecord = {
    id: `apt-${Date.now()}`,
    patientId: parsed.data.patientId,
    patientName: parsed.data.patientName,
    patientCode: parsed.data.patientCode,
    guardianName: parsed.data.guardianName,
    guardianPhone: parsed.data.guardianPhone,
    doctorId: parsed.data.doctorId,
    doctorName: parsed.data.doctorName,
    appointmentDate: parsed.data.appointmentDate,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    type: parsed.data.type,
    status: "booked",
    reason: parsed.data.reason || "Pediatric consultation",
    createdAt: new Date().toISOString(),
  };

  inMemoryAppointments.unshift(newAppointment);

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      await supabase.from("appointments").insert({
        patient_id: parsed.data.patientId,
        doctor_id: parsed.data.doctorId,
        appointment_date: parsed.data.appointmentDate,
        start_time: parsed.data.startTime + ":00",
        end_time: parsed.data.endTime + ":00",
        type: parsed.data.type,
        status: "booked",
        reason: parsed.data.reason || null,
      });
    } catch {
      // ignore
    }
  }

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { success: true, appointment: newAppointment };
}

export async function approveAppointmentAction(appointmentId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required to approve appointments." };
  }

  const existing = await fetchAllAppointments();
  const target = existing.find((a) => a.id === appointmentId);
  if (!target) {
    return { success: false, error: "Appointment record not found." };
  }

  // Idempotent: pressing Approve twice changes nothing the second time
  if (target.status === "confirmed") {
    return { success: true, alreadyConfirmed: true, appointment: target };
  }

  // Only assigned doctor and admin can approve
  const isAssignedDoctor =
    user.role === "doctor" &&
    (user.fullName.toLowerCase().includes(target.doctorName.toLowerCase()) ||
      target.doctorName.toLowerCase().includes(user.fullName.toLowerCase()) ||
      user.id === target.doctorId);
  const isAdmin = user.role === "admin";

  if (!isAssignedDoctor && !isAdmin) {
    return {
      success: false,
      error: `Permission Denied: Only ${target.doctorName} or a Hospital Administrator can approve this appointment.`,
    };
  }

  // Check conflict against existing confirmed slots
  const existingSlots: ExistingAppointmentSlot[] = existing.map((a) => ({
    id: a.id,
    doctorId: a.doctorId,
    doctorName: a.doctorName,
    appointmentDate: a.appointmentDate,
    startTime: a.startTime,
    endTime: a.endTime,
    status: a.status,
  }));

  const conflict = checkSlotConflict(
    {
      appointmentIdToExclude: appointmentId,
      doctorId: target.doctorId,
      appointmentDate: target.appointmentDate,
      startTime: target.startTime,
      endTime: target.endTime,
    },
    existingSlots
  );

  if (conflict.hasConflict) {
    return {
      success: false,
      error: `Conflict: ${target.doctorName} already has another active booking during ${target.startTime} - ${target.endTime} on ${target.appointmentDate}.`,
    };
  }

  // Update in-memory
  const apt = inMemoryAppointments.find((a) => a.id === appointmentId);
  if (apt) {
    apt.status = "confirmed";
  }

  // Update Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      await supabase
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("id", appointmentId);
    } catch (err) {
      console.error("Error confirming appointment in Supabase:", err);
    }
  }

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { success: true, appointment: apt || target };
}

export async function updateAppointmentStatusAction(
  appointmentId: string,
  newStatus: "booked" | "confirmed" | "completed" | "cancelled" | "no_show"
) {
  const apt = inMemoryAppointments.find((a) => a.id === appointmentId);
  if (apt) {
    apt.status = newStatus;
  }

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);
    } catch {
      // ignore
    }
  }

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rescheduleAppointmentAction(
  appointmentId: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string,
  doctorId: string
) {
  const existing = await fetchAllAppointments();
  const existingSlots: ExistingAppointmentSlot[] = existing.map((a) => ({
    id: a.id,
    doctorId: a.doctorId,
    doctorName: a.doctorName,
    appointmentDate: a.appointmentDate,
    startTime: a.startTime,
    endTime: a.endTime,
    status: a.status,
  }));

  const conflict = checkSlotConflict(
    {
      appointmentIdToExclude: appointmentId,
      doctorId,
      appointmentDate: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
    },
    existingSlots
  );

  if (conflict.hasConflict) {
    return {
      success: false,
      error: `Conflict: Doctor has another active booking during ${newStartTime} - ${newEndTime} on ${newDate}.`,
    };
  }

  const apt = inMemoryAppointments.find((a) => a.id === appointmentId);
  if (apt) {
    apt.appointmentDate = newDate;
    apt.startTime = newStartTime;
    apt.endTime = newEndTime;
    apt.status = "confirmed";
  }

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      await supabase
        .from("appointments")
        .update({
          appointment_date: newDate,
          start_time: newStartTime + ":00",
          end_time: newEndTime + ":00",
          status: "confirmed",
        })
        .eq("id", appointmentId);
    } catch {
      // ignore
    }
  }

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { success: true };
}
