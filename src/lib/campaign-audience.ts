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

export interface GuardianAudienceRow {
  guardianId: string;
  guardianName: string;
  guardianPhone: string;
  childrenNames: string[];
  childrenCount: number;
  hasConsent: boolean;
  consentStatus: "opted_in" | "opted_out" | "unverified";
  lastVisitDate?: string;
  outstandingBalance?: number;
}

export interface AudiencePreviewResult {
  totalMatchingChildren: number;
  uniqueMatchingGuardians: number;
  dedupedCount: number;
  excludedNoConsentCount: number;
  finalDeliverableCount: number;
  deliverableRecipients: DeliverableRecipient[];
  guardianRows: GuardianAudienceRow[];
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

  // 2. GUARDIAN-LEVEL GROUPING & DEDUPLICATION
  const guardiansGroupMap = new Map<
    string,
    {
      candidate: AudienceCandidate;
      childrenNames: string[];
      lastVisitDate?: string;
    }
  >();

  for (const candidate of matchingCandidates) {
    const existing = guardiansGroupMap.get(candidate.guardianId);
    if (!existing) {
      guardiansGroupMap.set(candidate.guardianId, {
        candidate,
        childrenNames: [candidate.fullName],
        lastVisitDate: candidate.lastVisitDate,
      });
    } else {
      existing.childrenNames.push(candidate.fullName);
      if (candidate.lastVisitDate) {
        if (!existing.lastVisitDate || new Date(candidate.lastVisitDate) > new Date(existing.lastVisitDate)) {
          existing.lastVisitDate = candidate.lastVisitDate;
        }
      }
    }
  }

  const totalMatchingChildren = matchingCandidates.length;
  const uniqueMatchingGuardians = guardiansGroupMap.size;
  const dedupedCount = Math.max(0, totalMatchingChildren - uniqueMatchingGuardians);

  // 3. CONSENT EVALUATION & GUARDIAN ROWS
  const deliverableRecipients: DeliverableRecipient[] = [];
  const guardianRows: GuardianAudienceRow[] = [];
  let excludedNoConsentCount = 0;

  for (const group of guardiansGroupMap.values()) {
    const { candidate, childrenNames, lastVisitDate } = group;
    const consentStatus = candidate.hasConsent ? "opted_in" : "opted_out";

    guardianRows.push({
      guardianId: candidate.guardianId,
      guardianName: candidate.guardianName,
      guardianPhone: candidate.guardianPhone,
      childrenNames,
      childrenCount: childrenNames.length,
      hasConsent: candidate.hasConsent,
      consentStatus,
      lastVisitDate,
      outstandingBalance: candidate.outstandingBalance,
    });

    if (candidate.hasConsent) {
      deliverableRecipients.push({
        guardianId: candidate.guardianId,
        guardianName: candidate.guardianName,
        guardianPhone: candidate.guardianPhone,
        childName: childrenNames[0], // primary matching child name
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
    guardianRows,
  };
}

/**
 * Resolves final deliverable campaign recipients strictly on the server.
 * Never blindly trusts recipient lists provided by the client.
 */
export function resolveCampaignRecipients(params: {
  candidates: AudienceCandidate[];
  criteria: AudienceCriteria;
  selectionMode?: "all" | "custom";
  selectedGuardianIds?: string[];
  excludedGuardianIds?: string[];
  referenceDate?: Date;
}): {
  deliverableRecipients: DeliverableRecipient[];
  stats: {
    totalTargeted: number;
    dedupedCount: number;
    excludedNoConsentCount: number;
    finalDeliverableCount: number;
  };
} {
  const preview = calculateCampaignAudience(
    params.candidates,
    params.criteria,
    params.referenceDate
  );

  const excludedSet = new Set(params.excludedGuardianIds || []);
  const selectedSet = params.selectedGuardianIds
    ? new Set(params.selectedGuardianIds)
    : null;

  const filteredRecipients = preview.deliverableRecipients.filter((r) => {
    if (excludedSet.has(r.guardianId)) return false;
    if (params.selectionMode === "custom" && selectedSet && !selectedSet.has(r.guardianId)) {
      return false;
    }
    return true;
  });

  return {
    deliverableRecipients: filteredRecipients,
    stats: {
      totalTargeted: preview.totalMatchingChildren,
      dedupedCount: preview.dedupedCount,
      excludedNoConsentCount: preview.excludedNoConsentCount,
      finalDeliverableCount: filteredRecipients.length,
    },
  };
}
