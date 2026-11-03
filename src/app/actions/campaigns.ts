"use server";

import { revalidatePath } from "next/cache";
import {
  createAndDispatchCampaign,
  retryFailedCampaignRecipients,
  sendCampaignTestMessage,
} from "@/lib/campaigns-store";
import {
  resolveCampaignRecipients,
  type AudienceCriteria,
  type AudienceCandidate,
} from "@/lib/campaign-audience";
import { fetchAllPatients } from "@/lib/patients-data";
import { fetchAllInvoices } from "@/lib/billing-store";

export interface CreateCampaignInput {
  title: string;
  templateName: string;
  category?: "utility" | "marketing";
  criteria: AudienceCriteria;
  selectionMode?: "all" | "custom";
  selectedGuardianIds?: string[];
  excludedGuardianIds?: string[];
  scheduleFor?: string | null;
}

export async function createCampaignAction(input: CreateCampaignInput) {
  try {
    // 1. Fetch live data strictly on server to prevent trusting client payloads
    const [patients, invoices] = await Promise.all([
      fetchAllPatients(),
      fetchAllInvoices(),
    ]);

    const candidates: AudienceCandidate[] = patients.map((p) => {
      const patientInvoices = invoices.filter((i) => i.patientId === p.id);
      const balance = patientInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
      const lastVisit = p.visits.length > 0 ? p.visits[0].visitDate : undefined;

      return {
        id: p.id,
        fullName: p.fullName,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        guardianId: p.guardian.id,
        guardianName: p.guardian.name,
        guardianPhone: p.guardian.phone,
        hasConsent: p.guardian.whatsappConsent === "opted_in",
        lastVisitDate: lastVisit,
        outstandingBalance: balance,
      };
    });

    // 2. Resolve recipients strictly on server
    const resolved = resolveCampaignRecipients({
      candidates,
      criteria: input.criteria,
      selectionMode: input.selectionMode || "all",
      selectedGuardianIds: input.selectedGuardianIds,
      excludedGuardianIds: input.excludedGuardianIds,
    });

    if (resolved.deliverableRecipients.length === 0) {
      return {
        success: false,
        error: "No eligible consented guardians selected for this campaign.",
      };
    }

    // 3. Dispatch or schedule campaign
    const campaign = await createAndDispatchCampaign({
      title: input.title,
      templateName: input.templateName,
      category: input.category || "marketing",
      criteria: input.criteria,
      audienceRecipients: resolved.deliverableRecipients,
      stats: resolved.stats,
      scheduleFor: input.scheduleFor,
    });

    revalidatePath("/campaigns");
    revalidatePath(`/campaigns/${campaign.id}`);
    return { success: true, campaign };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || "Failed to launch campaign",
    };
  }
}

export async function retryFailedRecipientsAction(campaignId: string) {
  try {
    const res = await retryFailedCampaignRecipients(campaignId);
    revalidatePath(`/campaigns/${campaignId}`);
    revalidatePath("/campaigns");
    return res;
  } catch (err: unknown) {
    return {
      success: false,
      retriedCount: 0,
      error: (err as Error).message || "Failed to retry campaign recipients",
    };
  }
}

export async function sendCampaignTestAction(params: {
  templateName: string;
  phone: string;
  guardianName?: string;
  childName?: string;
}) {
  try {
    const res = await sendCampaignTestMessage(params);
    return res;
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || "Failed to send test message",
    };
  }
}
