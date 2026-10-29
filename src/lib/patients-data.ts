import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Gender, BloodGroup, ConsentStatus } from "@/types/database";

export interface PatientDetailed {
  id: string;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup: BloodGroup | null;
  allergies: string[];
  medicalNotes: string | null;
  createdAt: string;
  guardian: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    relationship: string;
    whatsappConsent: ConsentStatus;
  };
  visits: Array<{
    id: string;
    visitDate: string;
    chiefComplaint: string;
    diagnosis: string | null;
    vitals: {
      weight_kg?: number;
      height_cm?: number;
      temp_c?: number;
      spo2?: number;
      pulse_bpm?: number;
    };
    prescription: string | null;
    doctorName?: string;
  }>;
  appointments: Array<{
    id: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    type: "new" | "follow_up" | "camp";
    status: "booked" | "confirmed" | "completed" | "cancelled" | "no_show";
    doctorName: string;
    reason: string | null;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    netAmount: number;
    paidAmount: number;
    status: "draft" | "issued" | "partially_paid" | "paid" | "cancelled";
    dueDate: string;
  }>;
  messages: Array<{
    id: string;
    body: string;
    category: "utility" | "marketing";
    status: "queued" | "sent" | "delivered" | "read" | "failed";
    createdAt: string;
  }>;
  medications: Array<{
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    scheduledTime: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>;
}

// In-memory store for newly registered patients/visits during mock testing
const inMemoryPatients: PatientDetailed[] = [
  {
    id: "44444444-4444-4444-4444-444444444401",
    patientCode: "PT-2026-000001",
    fullName: "Aarav Sharma",
    dateOfBirth: "2021-04-12",
    gender: "male",
    bloodGroup: "B+",
    allergies: ["Peanuts"],
    medicalNotes: "Mild childhood asthma. Keep inhaler handy during winter.",
    createdAt: "2026-09-01T10:00:00Z",
    guardian: {
      id: "33333333-3333-3333-3333-333333333301",
      name: "Rajesh Sharma",
      phone: "+919820011001",
      email: "rajesh.sharma@example.com",
      address: "Flat 402, Sea Green Apts, Andheri West, Mumbai",
      relationship: "Father",
      whatsappConsent: "opted_in",
    },
    visits: [
      {
        id: "vis-101",
        visitDate: "2026-10-28T10:30:00Z",
        chiefComplaint: "Acute wheezing, dry cough, and mild fever",
        diagnosis: "Acute Allergic Bronchitis with mild bronchospasm",
        vitals: { weight_kg: 18.2, height_cm: 108, temp_c: 38.1, spo2: 98, pulse_bpm: 96 },
        prescription: "Salbutamol Inhaler 100mcg (2 puffs via spacer SOS), Syrup Levocetirizine 2.5ml at bedtime x 5 days",
        doctorName: "Dr. Ananya Roy",
      },
      {
        id: "vis-102",
        visitDate: "2026-09-15T11:00:00Z",
        chiefComplaint: "Follow-up growth and allergy assessment",
        diagnosis: "Seasonal rhinitis under control",
        vitals: { weight_kg: 17.8, height_cm: 106, temp_c: 36.8, spo2: 99, pulse_bpm: 88 },
        prescription: "Saline nasal spray twice daily",
        doctorName: "Dr. Rahul Deshpande",
      },
      {
        id: "vis-103",
        visitDate: "2026-08-05T09:45:00Z",
        chiefComplaint: "Initial pediatric wellness examination",
        diagnosis: "Normal developmental milestones",
        vitals: { weight_kg: 17.4, height_cm: 104, temp_c: 37.0, spo2: 99, pulse_bpm: 90 },
        prescription: "Multivitamin syrup 5ml OD",
        doctorName: "Dr. Ananya Roy",
      },
    ],
    appointments: [
      {
        id: "apt-101",
        appointmentDate: "2026-11-04",
        startTime: "10:30:00",
        endTime: "11:00:00",
        type: "follow_up",
        status: "confirmed",
        doctorName: "Dr. Ananya Roy",
        reason: "Bronchitis resolution review & inhaler technique check",
      },
    ],
    invoices: [
      {
        id: "inv-101",
        invoiceNumber: "INV-2026-000001",
        netAmount: 600.0,
        paidAmount: 600.0,
        status: "paid",
        dueDate: "2026-10-28",
      },
    ],
    messages: [
      {
        id: "msg-101",
        body: "Namaste Rajesh Sharma. Reminder: Appointment for Aarav Sharma with Dr. Ananya Roy is scheduled for tomorrow at 10:30 AM at CareBridge Children Hospital.",
        category: "utility",
        status: "delivered",
        createdAt: "2026-10-27T10:30:00Z",
      },
    ],
    medications: [
      {
        id: "med-101",
        medicationName: "Salbutamol Inhaler 100mcg",
        dosage: "2 puffs with spacer",
        frequency: "SOS when coughing/wheezing",
        scheduledTime: "08:00:00",
        startDate: "2026-10-28",
        endDate: "2026-11-15",
        isActive: true,
      },
    ],
  },
  {
    id: "44444444-4444-4444-4444-444444444402",
    patientCode: "PT-2026-000002",
    fullName: "Ananya Sharma",
    dateOfBirth: "2023-09-18",
    gender: "female",
    bloodGroup: "B+",
    allergies: [],
    medicalNotes: "Sibling to Aarav Sharma. Healthy toddler.",
    createdAt: "2026-09-01T10:15:00Z",
    guardian: {
      id: "33333333-3333-3333-3333-333333333301",
      name: "Rajesh Sharma",
      phone: "+919820011001",
      email: "rajesh.sharma@example.com",
      address: "Flat 402, Sea Green Apts, Andheri West, Mumbai",
      relationship: "Father",
      whatsappConsent: "opted_in",
    },
    visits: [
      {
        id: "vis-201",
        visitDate: "2026-10-10T11:30:00Z",
        chiefComplaint: "Teething fever and restlessness",
        diagnosis: "Normal teething episode with mild gingival inflammation",
        vitals: { weight_kg: 12.4, height_cm: 86, temp_c: 37.8, spo2: 99, pulse_bpm: 105 },
        prescription: "Paracetamol drops 1ml SOS for fever > 38°C",
        doctorName: "Dr. Rahul Deshpande",
      },
    ],
    appointments: [],
    invoices: [
      {
        id: "inv-201",
        invoiceNumber: "INV-2026-000002",
        netAmount: 600.0,
        paidAmount: 600.0,
        status: "paid",
        dueDate: "2026-10-10",
      },
    ],
    messages: [],
    medications: [],
  },
  {
    id: "44444444-4444-4444-4444-444444444403",
    patientCode: "PT-2026-000003",
    fullName: "Rudra Patel",
    dateOfBirth: "2022-01-05",
    gender: "male",
    bloodGroup: "O+",
    allergies: [],
    medicalNotes: "Immunizations up-to-date.",
    createdAt: "2026-09-02T11:00:00Z",
    guardian: {
      id: "33333333-3333-3333-3333-333333333302",
      name: "Priya Patel",
      phone: "+919820011002",
      email: "priya.patel@example.com",
      address: "Sector 17, Vashi, Navi Mumbai",
      relationship: "Mother",
      whatsappConsent: "opted_in",
    },
    visits: [
      {
        id: "vis-301",
        visitDate: "2026-10-25T14:00:00Z",
        chiefComplaint: "Scheduled MMR / DTP Booster Vaccination",
        diagnosis: "Well child. Vaccination administered without adverse reaction.",
        vitals: { weight_kg: 16.5, height_cm: 102, temp_c: 36.9, spo2: 99, pulse_bpm: 92 },
        prescription: "Apply cold pack at injection site if swelling occurs",
        doctorName: "Dr. Rahul Deshpande",
      },
    ],
    appointments: [],
    invoices: [
      {
        id: "inv-301",
        invoiceNumber: "INV-2026-000003",
        netAmount: 1800.0,
        paidAmount: 1800.0,
        status: "paid",
        dueDate: "2026-10-25",
      },
    ],
    messages: [
      {
        id: "msg-301",
        body: "Namaste Priya Patel. Appointment reminder for Rudra Patel for DTP vaccination.",
        category: "utility",
        status: "delivered",
        createdAt: "2026-10-24T12:00:00Z",
      },
    ],
    medications: [],
  },
  {
    id: "44444444-4444-4444-4444-444444444405",
    patientCode: "PT-2026-000005",
    fullName: "Vihaan Verma",
    dateOfBirth: "2019-11-10",
    gender: "male",
    bloodGroup: "A+",
    allergies: ["Penicillin"],
    medicalNotes: "Severe penicillin allergy. Strict alert on prescription pad.",
    createdAt: "2026-09-03T09:30:00Z",
    guardian: {
      id: "33333333-3333-3333-3333-333333333303",
      name: "Amitabh Verma",
      phone: "+919820011003",
      email: "amitabh.v@example.com",
      address: "Bandra East, Mumbai",
      relationship: "Father",
      whatsappConsent: "opted_in",
    },
    visits: [
      {
        id: "vis-501",
        visitDate: "2026-10-18T16:00:00Z",
        chiefComplaint: "High fever 39°C with chills and sore throat",
        diagnosis: "Acute Pharyngotonsillitis (Non-penicillin therapy indicated)",
        vitals: { weight_kg: 22.4, height_cm: 119, temp_c: 39.0, spo2: 98, pulse_bpm: 104 },
        prescription: "Syrup Azithromycin 200mg/5ml once daily x 3 days (NO PENICILLIN)",
        doctorName: "Dr. Ananya Roy",
      },
    ],
    appointments: [],
    invoices: [
      {
        id: "inv-501",
        invoiceNumber: "INV-2026-000005",
        netAmount: 600.0,
        paidAmount: 600.0,
        status: "paid",
        dueDate: "2026-10-18",
      },
    ],
    messages: [],
    medications: [],
  },
  {
    id: "44444444-4444-4444-4444-444444444408",
    patientCode: "PT-2026-000008",
    fullName: "Kabir Malhotra",
    dateOfBirth: "2018-08-14",
    gender: "male",
    bloodGroup: "B-",
    allergies: [],
    medicalNotes: "Football player, frequent sports sprains.",
    createdAt: "2026-09-05T12:00:00Z",
    guardian: {
      id: "33333333-3333-3333-3333-333333333305",
      name: "Vikram Malhotra",
      phone: "+919820011005",
      email: "vikram.m@example.com",
      address: "Juhu Tara Road, Mumbai",
      relationship: "Father",
      whatsappConsent: "opted_out",
    },
    visits: [
      {
        id: "vis-801",
        visitDate: "2026-10-22T15:30:00Z",
        chiefComplaint: "Right ankle swelling after school sports",
        diagnosis: "Mild lateral ankle ligament strain (Grade 1)",
        vitals: { weight_kg: 28.5, height_cm: 132, temp_c: 36.8, spo2: 99, pulse_bpm: 80 },
        prescription: "RICE therapy, Gel Ibuprofen local application, crepe bandage",
        doctorName: "Dr. Tanvi Shah",
      },
    ],
    appointments: [],
    invoices: [
      {
        id: "inv-801",
        invoiceNumber: "INV-2026-000008",
        netAmount: 950.0,
        paidAmount: 450.0,
        status: "partially_paid",
        dueDate: "2026-10-22",
      },
    ],
    messages: [],
    medications: [],
  },
];

interface SupabasePatientRow {
  id: string;
  patient_code: string;
  full_name: string;
  date_of_birth: string;
  gender: Gender;
  blood_group: BloodGroup | null;
  allergies: string[] | null;
  medical_notes: string | null;
  created_at: string;
  guardian: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    relationship: string;
  } | null;
}

export async function fetchAllPatients(search?: string): Promise<PatientDetailed[]> {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from("patients")
        .select(`
          id,
          patient_code,
          full_name,
          date_of_birth,
          gender,
          blood_group,
          allergies,
          medical_notes,
          created_at,
          guardian:guardians (
            id,
            name,
            phone,
            email,
            address,
            relationship
          )
        `)
        .order("created_at", { ascending: false });

      if (search?.trim()) {
        const s = search.trim();
        query = query.or(`full_name.ilike.%${s}%,patient_code.ilike.%${s}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const rows = data as unknown as SupabasePatientRow[];
        return rows.map((row) => ({
          id: row.id,
          patientCode: row.patient_code,
          fullName: row.full_name,
          dateOfBirth: row.date_of_birth,
          gender: row.gender,
          bloodGroup: row.blood_group,
          allergies: row.allergies || [],
          medicalNotes: row.medical_notes,
          createdAt: row.created_at,
          guardian: {
            id: row.guardian?.id || "",
            name: row.guardian?.name || "Guardian",
            phone: row.guardian?.phone || "",
            email: row.guardian?.email || null,
            address: row.guardian?.address || null,
            relationship: row.guardian?.relationship || "Parent",
            whatsappConsent: "opted_in",
          },
          visits: [],
          appointments: [],
          invoices: [],
          messages: [],
          medications: [],
        }));
      }
    } catch {
      // fallback to in-memory patients
    }
  }

  // Fallback in-memory search
  if (!search?.trim()) {
    return inMemoryPatients;
  }

  const s = search.toLowerCase().trim();
  return inMemoryPatients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(s) ||
      p.patientCode.toLowerCase().includes(s) ||
      p.guardian.phone.includes(s) ||
      p.guardian.name.toLowerCase().includes(s)
  );
}

export async function fetchPatientById(id: string): Promise<PatientDetailed | null> {
  const local = inMemoryPatients.find((p) => p.id === id);
  if (local) return local;

  return inMemoryPatients[0] || null;
}

export async function addPatientRecord(patient: PatientDetailed) {
  inMemoryPatients.unshift(patient);
}

export async function addVisitRecord(
  patientId: string,
  visit: PatientDetailed["visits"][0]
) {
  const p = inMemoryPatients.find((item) => item.id === patientId);
  if (p) {
    p.visits.unshift(visit);
  }
}

export async function toggleGuardianConsent(
  guardianId: string,
  newStatus: ConsentStatus
) {
  const p = inMemoryPatients.find((item) => item.guardian.id === guardianId);
  if (p) {
    p.guardian.whatsappConsent = newStatus;
  }

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      await supabase.from("consents").insert({
        guardian_id: guardianId,
        channel: "whatsapp",
        status: newStatus,
        source: "manual_toggle",
      });
    } catch {
      // ignore
    }
  }
}
