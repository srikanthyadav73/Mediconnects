import { describe, it, expect } from "vitest";
import {
  calculateCampaignAudience,
  resolveCampaignRecipients,
  type AudienceCandidate,
  type AudienceCriteria,
} from "../src/lib/campaign-audience";
import { prepareAndSanitizeWhatsAppMessage } from "../src/lib/whatsapp-consent";


describe("Campaign Selection Table, Guardian Deduplication & Server Resolution", () => {
  const refDate = new Date("2026-10-29T10:00:00Z");

  const candidates: AudienceCandidate[] = [
    // Rajesh Sharma has 2 matching children (Aarav and Diya), has consent
    {
      id: "c-1",
      fullName: "Aarav Sharma",
      dateOfBirth: "2021-05-15",
      gender: "male",
      guardianId: "g-rajesh",
      guardianName: "Rajesh Sharma",
      guardianPhone: "+919820011001",
      hasConsent: true,
      lastVisitDate: "2026-10-20T10:00:00Z",
    },
    {
      id: "c-2",
      fullName: "Diya Sharma",
      dateOfBirth: "2023-01-10",
      gender: "female",
      guardianId: "g-rajesh",
      guardianName: "Rajesh Sharma",
      guardianPhone: "+919820011001",
      hasConsent: true,
      lastVisitDate: "2026-10-15T10:00:00Z",
    },
    // Priya Patel has 1 child, has consent
    {
      id: "c-3",
      fullName: "Rudra Patel",
      dateOfBirth: "2022-08-14",
      gender: "male",
      guardianId: "g-priya",
      guardianName: "Priya Patel",
      guardianPhone: "+919820011002",
      hasConsent: true,
      lastVisitDate: "2026-10-25T14:00:00Z",
    },
    // Amit Verma has 1 child, NO CONSENT (opted out)
    {
      id: "c-4",
      fullName: "Meera Verma",
      dateOfBirth: "2020-04-10",
      gender: "female",
      guardianId: "g-amit",
      guardianName: "Amit Verma",
      guardianPhone: "+919820011003",
      hasConsent: false,
      lastVisitDate: "2026-10-18T10:00:00Z",
    },
  ];

  const defaultCriteria: AudienceCriteria = {
    minAgeYears: 0,
    maxAgeYears: 10,
    gender: "all",
  };

  it("produces GuardianAudienceRow with aggregated sibling child names and count", () => {
    const preview = calculateCampaignAudience(candidates, defaultCriteria, refDate);

    expect(preview.guardianRows).toHaveLength(3);

    const rajeshRow = preview.guardianRows.find((r) => r.guardianId === "g-rajesh");
    expect(rajeshRow).toBeDefined();
    expect(rajeshRow?.childrenCount).toBe(2);
    expect(rajeshRow?.childrenNames).toEqual(["Aarav Sharma", "Diya Sharma"]);
    expect(rajeshRow?.hasConsent).toBe(true);
    expect(rajeshRow?.consentStatus).toBe("opted_in");

    const amitRow = preview.guardianRows.find((r) => r.guardianId === "g-amit");
    expect(amitRow).toBeDefined();
    expect(amitRow?.hasConsent).toBe(false);
    expect(amitRow?.consentStatus).toBe("opted_out");
  });

  describe("Server-Side Recipient Resolution (Security & Integrity)", () => {
    it("resolves all consented guardians when selectionMode is 'all'", () => {
      const resolved = resolveCampaignRecipients({
        candidates,
        criteria: defaultCriteria,
        selectionMode: "all",
        referenceDate: refDate,
      });

      expect(resolved.deliverableRecipients).toHaveLength(2); // Rajesh and Priya
      const ids = resolved.deliverableRecipients.map((r) => r.guardianId);
      expect(ids).toContain("g-rajesh");
      expect(ids).toContain("g-priya");
      expect(ids).not.toContain("g-amit"); // Excluded for no consent
    });

    it("honors server-side exclusions when staff deselects specific guardians", () => {
      const resolved = resolveCampaignRecipients({
        candidates,
        criteria: defaultCriteria,
        selectionMode: "all",
        excludedGuardianIds: ["g-rajesh"],
        referenceDate: refDate,
      });

      expect(resolved.deliverableRecipients).toHaveLength(1);
      expect(resolved.deliverableRecipients[0].guardianId).toBe("g-priya");
    });

    it("resolves strictly selected guardians in custom pick mode", () => {
      const resolved = resolveCampaignRecipients({
        candidates,
        criteria: defaultCriteria,
        selectionMode: "custom",
        selectedGuardianIds: ["g-rajesh"],
        referenceDate: refDate,
      });

      expect(resolved.deliverableRecipients).toHaveLength(1);
      expect(resolved.deliverableRecipients[0].guardianId).toBe("g-rajesh");
    });

    it("blocks unconsented guardians even if arbitrarily passed in selectedGuardianIds", () => {
      // Malicious or buggy client tries to include opted-out guardian 'g-amit'
      const resolved = resolveCampaignRecipients({
        candidates,
        criteria: defaultCriteria,
        selectionMode: "custom",
        selectedGuardianIds: ["g-amit", "g-priya"],
        referenceDate: refDate,
      });

      // Server resolution MUST reject g-amit
      expect(resolved.deliverableRecipients).toHaveLength(1);
      expect(resolved.deliverableRecipients[0].guardianId).toBe("g-priya");
    });
  });

  describe("Zero Clinical Diagnosis in Campaign Templates", () => {
    it("sanitizes clinical diagnosis keywords from campaign bodies", () => {
      const templateWithParam =
        "Dear {{guardian_name}}, update for {{patient_name}} regarding {{diagnosis}} at MediConnect.";

      const { sanitizedText, strippedClinicalData } = prepareAndSanitizeWhatsAppMessage(
        templateWithParam,
        {
          guardian_name: "Rajesh Sharma",
          patient_name: "Aarav",
          diagnosis: "Acute Bronchitis and Asthma Attack",
        }
      );

      expect(strippedClinicalData).toBe(true);
      expect(sanitizedText).not.toContain("Bronchitis");
      expect(sanitizedText).not.toContain("Asthma Attack");
      expect(sanitizedText).toContain("routine clinical consultation");
    });
  });
});
