import type { CampaignStatus, CampaignRecipientStatus } from "./database";
import type { AudienceCriteria } from "@/lib/campaign-audience";

export interface CampaignRecipientDetail {
  id: string;
  campaignId: string;
  guardianId: string;
  guardianName: string;
  guardianPhone: string;
  childName: string;
  status: CampaignRecipientStatus;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
}

export interface CampaignDetail {
  id: string;
  title: string;
  templateName: string;
  category: "utility" | "marketing";
  status: CampaignStatus;
  targetCriteria: AudienceCriteria;
  totalTargeted: number;
  dedupedCount: number;
  excludedNoConsentCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  createdAt: string;
  recipients: CampaignRecipientDetail[];
}

