import { normalizeIndianPhone } from "@/lib/validators/phone";

export interface DuplicateCheckInput {
  guardianPhone: string;
  patientName: string;
  dateOfBirth: string; // YYYY-MM-DD
}

export interface ExistingPatientRecord {
  id: string;
  patientCode: string;
  patientName: string;
  dateOfBirth: string;
  gender: string;
  guardianId: string;
  guardianName: string;
  guardianPhone: string;
  visitCount?: number;
}

export interface DuplicateDetectionResult {
  hasMatch: boolean;
  matchType: "exact_patient" | "same_guardian_sibling" | "none";
  matchedPatient?: ExistingPatientRecord;
  matchedGuardian?: {
    id: string;
    name: string;
    phone: string;
  };
}

/**
 * Checks for duplicate patients or existing guardians in memory or DB.
 * Rules:
 * 1. Match guardian by normalized E.164 phone.
 * 2. Match patient by name (case-insensitive trimmed) + date of birth.
 * 3. Never silently merge: returns structured details for UI confirmation.
 */
export function checkPatientDuplicate(
  input: DuplicateCheckInput,
  existingPatients: ExistingPatientRecord[]
): DuplicateDetectionResult {
  const normalizedPhone = normalizeIndianPhone(input.guardianPhone);
  const normalizedName = input.patientName.trim().toLowerCase();
  const inputDob = input.dateOfBirth.trim();

  // Find exact patient match: Same guardian phone AND same patient name AND same DOB
  const exactMatch = existingPatients.find((p) => {
    const phoneMatch =
      normalizeIndianPhone(p.guardianPhone) === normalizedPhone;
    const nameMatch = p.patientName.trim().toLowerCase() === normalizedName;
    const dobMatch = p.dateOfBirth === inputDob;
    return phoneMatch && nameMatch && dobMatch;
  });

  if (exactMatch) {
    return {
      hasMatch: true,
      matchType: "exact_patient",
      matchedPatient: exactMatch,
      matchedGuardian: {
        id: exactMatch.guardianId,
        name: exactMatch.guardianName,
        phone: exactMatch.guardianPhone,
      },
    };
  }

  // Find if guardian exists with other children (Sibling check)
  const guardianMatch = existingPatients.find(
    (p) => normalizeIndianPhone(p.guardianPhone) === normalizedPhone
  );

  if (guardianMatch) {
    return {
      hasMatch: false, // Not a patient duplicate, but existing guardian (sibling flow)
      matchType: "same_guardian_sibling",
      matchedGuardian: {
        id: guardianMatch.guardianId,
        name: guardianMatch.guardianName,
        phone: guardianMatch.guardianPhone,
      },
    };
  }

  return {
    hasMatch: false,
    matchType: "none",
  };
}

