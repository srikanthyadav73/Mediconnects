import { describe, it, expect } from "vitest";
import {
  checkPatientDuplicate,
  type ExistingPatientRecord,
} from "@/lib/patient-duplicate";

const mockDatabase: ExistingPatientRecord[] = [
  {
    id: "pat-1",
    patientCode: "PT-2026-000001",
    patientName: "Aarav Sharma",
    dateOfBirth: "2021-04-12",
    gender: "male",
    guardianId: "guard-1",
    guardianName: "Rajesh Sharma",
    guardianPhone: "+919820011001",
    visitCount: 3,
  },
  {
    id: "pat-2",
    patientCode: "PT-2026-000002",
    patientName: "Ananya Sharma",
    dateOfBirth: "2023-09-18",
    gender: "female",
    guardianId: "guard-1",
    guardianName: "Rajesh Sharma",
    guardianPhone: "+919820011001",
    visitCount: 1,
  },
];

describe("Patient Duplicate Detection Logic", () => {
  it("detects exact duplicate when phone, name (case-insensitive) and DOB match", () => {
    const result = checkPatientDuplicate(
      {
        guardianPhone: "9820011001", // raw 10-digit
        patientName: "aarav sharma", // lowercase
        dateOfBirth: "2021-04-12",
      },
      mockDatabase
    );

    expect(result.hasMatch).toBe(true);
    expect(result.matchType).toBe("exact_patient");
    expect(result.matchedPatient?.patientCode).toBe("PT-2026-000001");
    expect(result.matchedGuardian?.name).toBe("Rajesh Sharma");
  });

  it("detects sibling when guardian phone matches but patient name/DOB is different", () => {
    const result = checkPatientDuplicate(
      {
        guardianPhone: "+91 98200 11001",
        patientName: "Rohan Sharma",
        dateOfBirth: "2025-01-10",
      },
      mockDatabase
    );

    expect(result.hasMatch).toBe(false);
    expect(result.matchType).toBe("same_guardian_sibling");
    expect(result.matchedGuardian?.id).toBe("guard-1");
  });

  it("returns none when both guardian phone and patient are new", () => {
    const result = checkPatientDuplicate(
      {
        guardianPhone: "9988776655",
        patientName: "Vihaan Gupta",
        dateOfBirth: "2022-05-15",
      },
      mockDatabase
    );

    expect(result.hasMatch).toBe(false);
    expect(result.matchType).toBe("none");
    expect(result.matchedPatient).toBeUndefined();
  });
});

