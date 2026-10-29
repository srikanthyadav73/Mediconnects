"use server";

import { revalidatePath } from "next/cache";
import {
  createAndDispatchCampaign,
  retryFailedCampaignRecipients,
} from "@/lib/campaigns-store";
import type { AudienceCriteria, DeliverableRecipient } from "@/lib/campaign-audience";

export async function createCampaignAction(formData: {
  title: string;
  templateName: string;
  category?: "utility" | "marketing";
  criteria: AudienceCriteria;
  audienceRecipients: DeliverableRecipient[];
  stats: {
    totalTargeted: number;
    dedupedCount: number;
    excludedNoConsentCount: number;
  };
}) {
  try {
    const campaign = await createAndDispatchCampaign(formData);
    revalidatePath("/campaigns");
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
