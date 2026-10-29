"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizeIndianPhone, isValidIndianMobile } from "@/lib/validators/phone";
import {
  checkPatientDuplicate,
  type DuplicateDetectionResult,
} from "@/lib/patient-duplicate";
import {
  fetchAllPatients,
  addPatientRecord,
  addVisitRecord,
  toggleGuardianConsent,
  type PatientDetailed,
} from "@/lib/patients-data";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Gender, BloodGroup, ConsentStatus } from "@/types/database";

const registrationSchema = z.object({
  // Guardian
  guardianName: z.string().min(2, "Guardian name is required"),
  guardianPhone: z.string().refine((val) => isValidIndianMobile(val), {
    message: "Enter a valid 10-digit Indian mobile number",
  }),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  guardianAddress: z.string().optional().or(z.literal("")),
  relationship: z.string().default("Parent"),

  // Child
  childName: z.string().min(2, "Child's name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"]),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  allergies: z.string().optional().or(z.literal("")),
  medicalNotes: z.string().optional().or(z.literal("")),

  // Initial Visit
  chiefComplaint: z.string().min(3, "Chief complaint is required"),
  doctorName: z.string().default("Dr. Ananya Roy"),
  weightKg: z.coerce.number().min(0.5).max(120).optional(),
  heightCm: z.coerce.number().min(20).max(220).optional(),
  tempC: z.coerce.number().min(34).max(43).optional(),
  spo2: z.coerce.number().min(50).max(100).optional(),
  pulseBpm: z.coerce.number().min(40).max(220).optional(),
  prescription: z.string().optional().or(z.literal("")),

  // Consent
  whatsappConsent: z.boolean().default(true),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;

/**
 * Pre-screening duplicate check called before persisting record.
 */
export async function preScreenDuplicateAction(
  data: Pick<RegistrationFormValues, "guardianPhone" | "childName" | "dateOfBirth">
): Promise<DuplicateDetectionResult> {
  const allPatients = await fetchAllPatients();
  const existingRecords = allPatients.map((p) => ({
    id: p.id,
    patientCode: p.patientCode,
    patientName: p.fullName,
    dateOfBirth: p.dateOfBirth,
    gender: p.gender,
    guardianId: p.guardian.id,
    guardianName: p.guardian.name,
    guardianPhone: p.guardian.phone,
    visitCount: p.visits.length,
  }));

  return checkPatientDuplicate(
    {
      guardianPhone: data.guardianPhone,
      patientName: data.childName,
      dateOfBirth: data.dateOfBirth,
    },
    existingRecords
  );
}

/**
 * Persists registered patient and initial visit.
 */
export async function registerPatientAndVisitAction(
  data: RegistrationFormValues,
  options?: {
    useExistingPatientId?: string;
  }
) {
  const parsed = registrationSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Validation failed.",
    };
  }

  const normalizedPhone = normalizeIndianPhone(parsed.data.guardianPhone)!;
  const allergiesArray = parsed.data.allergies
    ? parsed.data.allergies.split(",").map((a) => a.trim()).filter(Boolean)
    : [];

  const visitRecord = {
    id: `vis-${Date.now()}`,
    visitDate: new Date().toISOString(),
    chiefComplaint: parsed.data.chiefComplaint,
    diagnosis: parsed.data.prescription ? "Consultation & treatment prescribed" : "Initial clinical review",
    vitals: {
      weight_kg: parsed.data.weightKg,
      height_cm: parsed.data.heightCm,
      temp_c: parsed.data.tempC,
      spo2: parsed.data.spo2,
      pulse_bpm: parsed.data.pulseBpm,
    },
    prescription: parsed.data.prescription || null,
    doctorName: parsed.data.doctorName,
  };

  // If user selected "Use existing patient (record new visit)"
  if (options?.useExistingPatientId) {
    await addVisitRecord(options.useExistingPatientId, visitRecord);
    revalidatePath("/patients");
    revalidatePath(`/patients/${options.useExistingPatientId}`);
    revalidatePath("/visits");
    return {
      success: true,
      patientId: options.useExistingPatientId,
      isExisting: true,
      message: "New clinical visit attached to existing patient record.",
    };
  }

  // Create brand new patient record
  const newPatientId = `pat-${Date.now()}`;
  const randomCodeNum = Math.floor(1000 + Math.random() * 9000);
  const patientCode = `PT-2026-00${randomCodeNum}`;
  const guardianId = `guard-${Date.now()}`;

  const newPatient: PatientDetailed = {
    id: newPatientId,
    patientCode,
    fullName: parsed.data.childName,
    dateOfBirth: parsed.data.dateOfBirth,
    gender: parsed.data.gender as Gender,
    bloodGroup: (parsed.data.bloodGroup as BloodGroup) || null,
    allergies: allergiesArray,
    medicalNotes: parsed.data.medicalNotes || null,
    createdAt: new Date().toISOString(),
    guardian: {
      id: guardianId,
      name: parsed.data.guardianName,
      phone: normalizedPhone,
      email: parsed.data.guardianEmail || null,
      address: parsed.data.guardianAddress || null,
      relationship: parsed.data.relationship,
      whatsappConsent: parsed.data.whatsappConsent ? "opted_in" : "opted_out",
    },
    visits: [visitRecord],
    appointments: [],
    invoices: [
      {
        id: `inv-${Date.now()}`,
        invoiceNumber: `INV-2026-00${randomCodeNum}`,
        netAmount: 600.0,
        paidAmount: 600.0,
        status: "paid",
        dueDate: new Date().toISOString().split("T")[0],
      },
    ],
    messages: [
      {
        id: `msg-${Date.now()}`,
        body: `Namaste ${parsed.data.guardianName}. Registration successful for ${parsed.data.childName} (Code: ${patientCode}) at CareBridge Children Hospital.`,
        category: "utility",
        status: "delivered",
        createdAt: new Date().toISOString(),
      },
    ],
    medications: [],
  };

  await addPatientRecord(newPatient);

  // If Supabase is connected
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      // Insert guardian
      const { data: gData } = await supabase
        .from("guardians")
        .upsert(
          {
            name: parsed.data.guardianName,
            phone: normalizedPhone,
            email: parsed.data.guardianEmail || null,
            address: parsed.data.guardianAddress || null,
            relationship: parsed.data.relationship,
          },
          { onConflict: "phone" }
        )
        .select("id")
        .single();

      if (gData?.id) {
        // Insert patient
        const { data: pData } = await supabase
          .from("patients")
          .insert({
            guardian_id: gData.id,
            full_name: parsed.data.childName,
            date_of_birth: parsed.data.dateOfBirth,
            gender: parsed.data.gender as Gender,
            blood_group: (parsed.data.bloodGroup as BloodGroup) || null,
            allergies: allergiesArray,
            medical_notes: parsed.data.medicalNotes || null,
          })
          .select("id, patient_code")
          .single();

        if (pData?.id) {
          // Insert visit
          await supabase.from("visits").insert({
            patient_id: pData.id,
            chief_complaint: parsed.data.chiefComplaint,
            diagnosis: visitRecord.diagnosis,
            vitals: visitRecord.vitals,
            prescription: visitRecord.prescription,
          });

          // Insert consent
          await supabase.from("consents").insert({
            guardian_id: gData.id,
            channel: "whatsapp",
            status: parsed.data.whatsappConsent ? "opted_in" : "opted_out",
            source: "registration",
          });
        }
      }
    } catch (err) {
      console.error("Supabase error during registration:", err);
    }
  }

  revalidatePath("/patients");
  revalidatePath("/visits");
  revalidatePath("/dashboard");

  return {
    success: true,
    patientId: newPatientId,
    patientCode,
    isExisting: false,
    message: `Patient ${parsed.data.childName} registered successfully with code ${patientCode}.`,
  };
}

/**
 * Records a new visit for an existing patient.
 */
export async function recordNewVisitAction(
  patientId: string,
  data: {
    chiefComplaint: string;
    diagnosis?: string;
    prescription?: string;
    doctorName?: string;
    weightKg?: number;
    heightCm?: number;
    tempC?: number;
    spo2?: number;
    pulseBpm?: number;
  }
) {
  const visit = {
    id: `vis-${Date.now()}`,
    visitDate: new Date().toISOString(),
    chiefComplaint: data.chiefComplaint,
    diagnosis: data.diagnosis || "Pediatric consultation",
    vitals: {
      weight_kg: data.weightKg,
      height_cm: data.heightCm,
      temp_c: data.tempC,
      spo2: data.spo2,
      pulse_bpm: data.pulseBpm,
    },
    prescription: data.prescription || null,
    doctorName: data.doctorName || "Dr. Ananya Roy",
  };

  await addVisitRecord(patientId, visit);
  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/visits");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Toggles guardian WhatsApp consent directly.
 */
export async function toggleWhatsAppConsentAction(
  guardianId: string,
  newStatus: ConsentStatus
) {
  await toggleGuardianConsent(guardianId, newStatus);
  revalidatePath("/patients");
  return { success: true };
}
