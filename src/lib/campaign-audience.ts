import { calculateAgeYears } from "@/lib/utils";

export interface AudienceCriteria {
  minAgeYears?: number;
  maxAgeYears?: number;
  gender?: "all" | "male" | "female";
  visitedWithinDays?: number;
  hasOutstandingBalance?: boolean;
}

export interface AudienceCandidate {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  guardianId: string;
  guardianName: string;
  guardianPhone: string;
  hasConsent: boolean;
  lastVisitDate?: string; // ISO date string
  outstandingBalance?: number;
}

export interface DeliverableRecipient {
  guardianId: string;
  guardianName: string;
  guardianPhone: string;
  childName: string;
}

export interface AudiencePreviewResult {
  totalMatchingChildren: number;
  uniqueMatchingGuardians: number;
  dedupedCount: number;
  excludedNoConsentCount: number;
  finalDeliverableCount: number;
  deliverableRecipients: DeliverableRecipient[];
}

/**
 * Filters patient candidates by clinical & billing criteria, then performs strict
 * GUARDIAN-LEVEL deduplication and consent enforcement:
 * - A parent with three children matching the criteria receives exactly ONE message.
 * - Guardians with unconfirmed or opted-out consent are excluded and counted.
 */
export function calculateCampaignAudience(
  candidates: AudienceCandidate[],
  criteria: AudienceCriteria,
  referenceDate: Date = new Date()
): AudiencePreviewResult {
  const minAge = criteria.minAgeYears ?? 0;
  const maxAge = criteria.maxAgeYears ?? 18;
  const targetGender = criteria.gender || "all";
  const visitedWithinDays = criteria.visitedWithinDays;
  const requireOutstanding = criteria.hasOutstandingBalance ?? false;

  // 1. Filter matching children based on clinical/demographic criteria
  const matchingCandidates = candidates.filter((child) => {
    // Age check
    const age = calculateAgeYears(child.dateOfBirth, referenceDate);
    if (age < minAge || age > maxAge) return false;

    // Gender check
    if (targetGender !== "all" && child.gender !== targetGender) return false;

    // Visited within N days check
    if (visitedWithinDays && visitedWithinDays > 0) {
      if (!child.lastVisitDate) return false;
      const lastVisitTime = new Date(child.lastVisitDate).getTime();
      const diffDays = (referenceDate.getTime() - lastVisitTime) / (1000 * 60 * 60 * 24);
      if (diffDays > visitedWithinDays || diffDays < 0) return false;
    }

    // Outstanding balance check
    if (requireOutstanding) {
      if (!child.outstandingBalance || child.outstandingBalance <= 0) return false;
    }

    return true;
  });

  // 2. GUARDIAN-LEVEL DEDUPLICATION
  // Map keyed by guardianId to enforce 1 message per guardian
  const uniqueGuardiansMap = new Map<string, AudienceCandidate>();

  for (const candidate of matchingCandidates) {
    if (!uniqueGuardiansMap.has(candidate.guardianId)) {
      uniqueGuardiansMap.set(candidate.guardianId, candidate);
    }
  }

  const totalMatchingChildren = matchingCandidates.length;
  const uniqueMatchingGuardians = uniqueGuardiansMap.size;
  const dedupedCount = Math.max(0, totalMatchingChildren - uniqueMatchingGuardians);

  // 3. CONSENT EXCLUSION
  const deliverableRecipients: DeliverableRecipient[] = [];
  let excludedNoConsentCount = 0;

  for (const guardianCandidate of uniqueGuardiansMap.values()) {
    if (guardianCandidate.hasConsent) {
      deliverableRecipients.push({
        guardianId: guardianCandidate.guardianId,
        guardianName: guardianCandidate.guardianName,
        guardianPhone: guardianCandidate.guardianPhone,
        childName: guardianCandidate.fullName,
      });
    } else {
      excludedNoConsentCount++;
    }
  }

  return {
    totalMatchingChildren,
    uniqueMatchingGuardians,
    dedupedCount,
    excludedNoConsentCount,
    finalDeliverableCount: deliverableRecipients.length,
    deliverableRecipients,
  };
}
