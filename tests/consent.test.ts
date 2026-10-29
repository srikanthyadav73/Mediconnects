import { describe, it, expect } from "vitest";
import {
  hasValidWhatsAppConsent,
  prepareAndSanitizeWhatsAppMessage,
  type ConsentRecord,
} from "../src/lib/whatsapp-consent";

describe("WhatsApp Consent Enforcement & Privacy Protection", () => {
  const guardianId = "guard-001";

  it("denies sending when guardian has no prior consent history", () => {
    const records: ConsentRecord[] = [];
    expect(hasValidWhatsAppConsent(records)).toBe(false);
  });

  it("permits sending when guardian's latest consent is opted_in", () => {
    const records: ConsentRecord[] = [
      {
        guardianId,
        status: "opted_in",
        createdAt: "2026-10-01T10:00:00Z",
      },
    ];
    expect(hasValidWhatsAppConsent(records)).toBe(true);
  });

  it("blocks sending when guardian has opted_out", () => {
    const records: ConsentRecord[] = [
      {
        guardianId,
        status: "opted_out",
        createdAt: "2026-10-01T10:00:00Z",
      },
    ];
    expect(hasValidWhatsAppConsent(records)).toBe(false);
  });

  it("strictly evaluates the LATEST consent event regardless of initial state", () => {
    // Parent opted in initially, but replied STOP on Oct 15
    const history1: ConsentRecord[] = [
      { guardianId, status: "opted_in", createdAt: "2026-10-01T10:00:00Z" },
      { guardianId, status: "opted_out", createdAt: "2026-10-15T12:00:00Z" },
    ];
    expect(hasValidWhatsAppConsent(history1)).toBe(false);

    // Parent previously opted out, but consented during physical OPD registration on Oct 20
    const history2: ConsentRecord[] = [
      { guardianId, status: "opted_out", createdAt: "2026-10-10T08:00:00Z" },
      { guardianId, status: "opted_in", createdAt: "2026-10-20T09:30:00Z" },
    ];
    expect(hasValidWhatsAppConsent(history2)).toBe(true);
  });

  it("correctly handles unsorted chronological arrays", () => {
    // Array order is reversed, but timestamp on opted_out is newer
    const unsorted: ConsentRecord[] = [
      { guardianId, status: "opted_out", createdAt: "2026-10-25T10:00:00Z" },
      { guardianId, status: "opted_in", createdAt: "2026-10-01T10:00:00Z" },
    ];
    expect(hasValidWhatsAppConsent(unsorted)).toBe(false);
  });

  it("strictly scrubs diagnosis parameters from WhatsApp message texts", () => {
    const template =
      "Dear {{guardian_name}}, reminder for {{patient_name}}'s appointment for {{diagnosis}} with {{doctor_name}} on {{date}}.";
    const params = {
      guardian_name: "Anita Sharma",
      patient_name: "Aarav",
      diagnosis: "Severe Acute Bronchitis and Asthma Attack",
      doctor_name: "Dr. Ananya Roy",
      date: "Tomorrow at 10:30 AM",
    };

    const { sanitizedText, strippedClinicalData } = prepareAndSanitizeWhatsAppMessage(
      template,
      params
    );

    expect(strippedClinicalData).toBe(true);
    expect(sanitizedText).not.toContain("Bronchitis");
    expect(sanitizedText).not.toContain("Asthma Attack");
    expect(sanitizedText).toContain("routine clinical consultation");
    expect(sanitizedText).toContain("Dear Anita Sharma");
    expect(sanitizedText).toContain("Dr. Ananya Roy");
  });

  it("preserves standard non-clinical appointment parameters intact", () => {
    const template =
      "Hello {{guardian_name}}, appointment confirmed for {{patient_name}} on {{date}} at CareBridge Children's Hospital.";
    const params = {
      guardian_name: "Vikram Malhotra",
      patient_name: "Kabir",
      date: "29 Oct 2026 at 4:00 PM",
    };

    const { sanitizedText, strippedClinicalData } = prepareAndSanitizeWhatsAppMessage(
      template,
      params
    );

    expect(strippedClinicalData).toBe(false);
    expect(sanitizedText).toBe(
      "Hello Vikram Malhotra, appointment confirmed for Kabir on 29 Oct 2026 at 4:00 PM at CareBridge Children's Hospital."
    );
  });
});
