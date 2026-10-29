import { describe, it, expect } from "vitest";
import {
  calculateCampaignAudience,
  type AudienceCandidate,
} from "../src/lib/campaign-audience";

describe("Campaign Audience Filtering & Guardian Deduplication", () => {
  const refDate = new Date("2026-10-29T10:00:00Z");

  const sampleCandidates: AudienceCandidate[] = [
    // Parent 1 (Rajesh) has 3 siblings!
    {
      id: "child-1",
      fullName: "Aarav Sharma",
      dateOfBirth: "2021-05-15", // ~5 yrs old
      gender: "male",
      guardianId: "parent-1",
      guardianName: "Rajesh Sharma",
      guardianPhone: "+919820011001",
      hasConsent: true,
      lastVisitDate: "2026-10-20T10:00:00Z", // 9 days ago
      outstandingBalance: 0,
    },
    {
      id: "child-2",
      fullName: "Diya Sharma",
      dateOfBirth: "2023-01-10", // ~3 yrs old
      gender: "female",
      guardianId: "parent-1",
      guardianName: "Rajesh Sharma",
      guardianPhone: "+919820011001",
      hasConsent: true,
      lastVisitDate: "2026-10-15T10:00:00Z", // 14 days ago
      outstandingBalance: 0,
    },
    {
      id: "child-3",
      fullName: "Vihaan Sharma",
      dateOfBirth: "2019-11-20", // ~6 yrs old
      gender: "male",
      guardianId: "parent-1",
      guardianName: "Rajesh Sharma",
      guardianPhone: "+919820011001",
      hasConsent: true,
      lastVisitDate: "2026-09-01T10:00:00Z", // ~58 days ago
      outstandingBalance: 0,
    },

    // Parent 2 (Priya) has 1 child, has consent
    {
      id: "child-4",
      fullName: "Rudra Patel",
      dateOfBirth: "2022-08-14", // ~4 yrs old
      gender: "male",
      guardianId: "parent-2",
      guardianName: "Priya Patel",
      guardianPhone: "+919820011002",
      hasConsent: true,
      lastVisitDate: "2026-10-25T14:00:00Z", // 4 days ago
      outstandingBalance: 1800, // Has outstanding balance
    },

    // Parent 3 (Amit) has 1 child, BUT HAS NO CONSENT (opted out)
    {
      id: "child-5",
      fullName: "Meera Verma",
      dateOfBirth: "2020-04-10", // ~6 yrs old
      gender: "female",
      guardianId: "parent-3",
      guardianName: "Amit Verma",
      guardianPhone: "+919820011003",
      hasConsent: false, // NO CONSENT
      lastVisitDate: "2026-10-18T10:00:00Z",
      outstandingBalance: 0,
    },

    // Parent 4 (Vikram) has 1 older teenager (15 yrs old)
    {
      id: "child-6",
      fullName: "Kabir Malhotra",
      dateOfBirth: "2011-03-05", // ~15 yrs old
      gender: "male",
      guardianId: "parent-4",
      guardianName: "Vikram Malhotra",
      guardianPhone: "+919820011005",
      hasConsent: true,
      lastVisitDate: "2026-10-22T15:30:00Z",
      outstandingBalance: 500,
    },
  ];

  it("strictly deduplicates multiple siblings to 1 message at the guardian level", () => {
    // Target age 0-10: covers Aarav, Diya, Vihaan (all parent-1), Rudra (parent-2), Meera (parent-3)
    const result = calculateCampaignAudience(
      sampleCandidates,
      { minAgeYears: 0, maxAgeYears: 10 },
      refDate
    );

    // 5 matching children
    expect(result.totalMatchingChildren).toBe(5);
    // 3 unique guardians: parent-1, parent-2, parent-3
    expect(result.uniqueMatchingGuardians).toBe(3);
    // 2 sibling deduplications (Aarav, Diya, Vihaan -> 1 parent)
    expect(result.dedupedCount).toBe(2);
    // 1 excluded for no consent (parent-3)
    expect(result.excludedNoConsentCount).toBe(1);
    // Final deliverable recipients = 2 (parent-1, parent-2)
    expect(result.finalDeliverableCount).toBe(2);

    const recipientPhones = result.deliverableRecipients.map((r) => r.guardianPhone);
    expect(recipientPhones).toEqual(["+919820011001", "+919820011002"]);
  });

  it("filters accurately by child gender", () => {
    // Only females
    const result = calculateCampaignAudience(
      sampleCandidates,
      { gender: "female" },
      refDate
    );

    // Diya Sharma & Meera Verma
    expect(result.totalMatchingChildren).toBe(2);
    expect(result.uniqueMatchingGuardians).toBe(2);
    // Meera has no consent -> 1 deliverable (Diya's parent)
    expect(result.finalDeliverableCount).toBe(1);
    expect(result.deliverableRecipients[0].guardianName).toBe("Rajesh Sharma");
  });

  it("filters accurately by visit recency (within N days)", () => {
    // Visited within 10 days (>= 2026-10-19)
    // Matches: child-1 (Aarav, 9d ago), child-4 (Rudra, 4d ago), child-6 (Kabir, 7d ago)
    const result = calculateCampaignAudience(
      sampleCandidates,
      { visitedWithinDays: 10 },
      refDate
    );

    expect(result.totalMatchingChildren).toBe(3);
    expect(result.finalDeliverableCount).toBe(3);
  });

  it("filters accurately by outstanding balance due", () => {
    // Only patients with outstanding balance
    const result = calculateCampaignAudience(
      sampleCandidates,
      { hasOutstandingBalance: true },
      refDate
    );

    // child-4 (Rudra, 1800) & child-6 (Kabir, 500)
    expect(result.totalMatchingChildren).toBe(2);
    expect(result.finalDeliverableCount).toBe(2);
    const names = result.deliverableRecipients.map((r) => r.guardianName);
    expect(names).toContain("Priya Patel");
    expect(names).toContain("Vikram Malhotra");
  });
});

