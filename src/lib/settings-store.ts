import { HOSPITAL_SERVICES, type HospitalServiceItem } from "@/types/billing";
import { DEMO_USERS, type SessionUser } from "@/lib/auth";
import type { UserRole } from "@/types/database";

export interface HospitalProfile {
  hospitalName: string;
  tagline: string;
  registrationNumber: string;
  gstin: string;
  nabhAccreditation: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  helplinePhone: string;
  opdPhone: string;
  emergencyPhone: string;
  whatsappNumber: string;
  operatingHours: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  tableName: string;
  recordRef: string;
  ipAddress: string;
  details: string;
}

let inMemoryProfile: HospitalProfile = {
  hospitalName: "MediConnect Children's Hospital",
  tagline: "Center for Pediatric Excellence & Compassionate Child Care",
  registrationNumber: "ND-PED-2026-889",
  gstin: "07AAAAA0000A1Z5",
  nabhAccreditation: "NABH Full Accreditation (Pediatric Super-Specialty)",
  address: "Plot 42, Sector 5, Medical Enclave",
  city: "New Delhi",
  state: "Delhi NCR",
  pincode: "110001",
  helplinePhone: "1800-200-KIDS (5437)",
  opdPhone: "+91 11 2345 6789",
  emergencyPhone: "+91 11 2345 6999",
  whatsappNumber: "+91 98200 11000",
  operatingHours: "24x7 Pediatric Emergency • OPD: Mon-Sat 08:00 AM - 08:00 PM",
};

let inMemoryTariffs: HospitalServiceItem[] = [...HOSPITAL_SERVICES];

let inMemoryStaff: SessionUser[] = Object.values(DEMO_USERS);

const inMemoryAuditLogs: AuditLogItem[] = [
  {
    id: "aud-001",
    timestamp: "2026-10-29T09:30:15Z",
    actorName: "Dr. Ananya Roy",
    actorRole: "admin",
    action: "CAMPAIGN_DISPATCHED",
    tableName: "campaigns",
    recordRef: "cmp-001",
    ipAddress: "192.168.1.104",
    details: "Dispatched 18 deduplicated WhatsApp messages for Seasonal Asthma Camp.",
  },
  {
    id: "aud-002",
    timestamp: "2026-10-29T08:45:00Z",
    actorName: "Kavita S.",
    actorRole: "receptionist",
    action: "PAYMENT_RECORDED",
    tableName: "payments",
    recordRef: "pay-101",
    ipAddress: "192.168.1.102",
    details: "Recorded ₹600.00 UPI collection for Invoice INV-2026-000001.",
  },
  {
    id: "aud-003",
    timestamp: "2026-10-29T08:15:30Z",
    actorName: "Kavita S.",
    actorRole: "receptionist",
    action: "PATIENT_REGISTERED",
    tableName: "patients",
    recordRef: "PT-2026-000001",
    ipAddress: "192.168.1.102",
    details: "Registered child Aarav Sharma (DOB 2021-05-15) with guardian Rajesh Sharma.",
  },
  {
    id: "aud-004",
    timestamp: "2026-10-29T08:00:00Z",
    actorName: "System Daemon",
    actorRole: "admin",
    action: "CRON_REMINDERS_RUN",
    tableName: "messages",
    recordRef: "job-reminders-24h",
    ipAddress: "127.0.0.1",
    details: "Automated 24h & 2h appointment reminder check processed 16 outpatient slots.",
  },
  {
    id: "aud-005",
    timestamp: "2026-10-28T16:20:00Z",
    actorName: "Dr. Rahul Deshpande",
    actorRole: "doctor",
    action: "CONSENT_RECORDED",
    tableName: "consents",
    recordRef: "cns-882",
    ipAddress: "192.168.1.105",
    details: "Verified physical OPD consent from Priya Patel for Rudra Patel.",
  },
  {
    id: "aud-006",
    timestamp: "2026-10-28T14:10:00Z",
    actorName: "Kavita S.",
    actorRole: "receptionist",
    action: "APPOINTMENT_CONFIRMED",
    tableName: "appointments",
    recordRef: "apt-002",
    ipAddress: "192.168.1.102",
    details: "Confirmed slot for Kabir Malhotra on 2026-10-29 11:00 AM.",
  },
];

export async function getHospitalProfile(): Promise<HospitalProfile> {
  return inMemoryProfile;
}

export async function updateHospitalProfile(data: HospitalProfile): Promise<HospitalProfile> {
  inMemoryProfile = { ...data };
  return inMemoryProfile;
}

export async function getTariffServices(): Promise<HospitalServiceItem[]> {
  return inMemoryTariffs;
}

export async function addTariffService(item: HospitalServiceItem): Promise<HospitalServiceItem[]> {
  inMemoryTariffs = [...inMemoryTariffs, item];
  return inMemoryTariffs;
}

export async function updateTariffFee(serviceId: string, newFee: number): Promise<HospitalServiceItem[]> {
  inMemoryTariffs = inMemoryTariffs.map((s) => (s.id === serviceId ? { ...s, defaultFee: newFee } : s));
  return inMemoryTariffs;
}

export async function getStaffUsers(): Promise<SessionUser[]> {
  return inMemoryStaff;
}

export async function updateStaffRole(userId: string, newRole: UserRole): Promise<SessionUser[]> {
  inMemoryStaff = inMemoryStaff.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
  return inMemoryStaff;
}

export async function addStaffUser(user: SessionUser): Promise<SessionUser[]> {
  inMemoryStaff = [...inMemoryStaff, user];
  return inMemoryStaff;
}

export async function getAuditLogs(): Promise<AuditLogItem[]> {
  return inMemoryAuditLogs;
}

