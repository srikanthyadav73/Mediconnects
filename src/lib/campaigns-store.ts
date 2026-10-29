import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { whatsappProvider } from "@/lib/providers/whatsapp";
import type { CampaignDetail, CampaignRecipientDetail } from "@/types/campaigns";
import type { AudienceCriteria, DeliverableRecipient } from "@/lib/campaign-audience";
import type { CampaignStatus, CampaignRecipientStatus } from "@/types/database";

interface SupabaseCampaignRecipientRaw {
  id: string;
  campaign_id: string;
  guardian_id: string;
  status: CampaignRecipientStatus;
  message_id: string | null;
  error_reason: string | null;
  created_at: string;
}

interface SupabaseCampaignRaw {
  id: string;
  title: string;
  template_id: string | null;
  status: CampaignStatus;
  audience_criteria: AudienceCriteria | null;
  total_target: number | null;
  sent_count: number | null;
  delivered_count: number | null;
  read_count: number | null;
  failed_count: number | null;
  created_at: string;
  recipients: SupabaseCampaignRecipientRaw[] | null;
}

const inMemoryCampaigns: CampaignDetail[] = [
  {
    id: "cmp-001",
    title: "Seasonal Pediatric Asthma & Allergy Screening Camp",
    templateName: "seasonal_pediatric_camp",
    category: "marketing",
    status: "completed",
    targetCriteria: {
      minAgeYears: 0,
      maxAgeYears: 12,
      gender: "all",
      visitedWithinDays: 90,
      hasOutstandingBalance: false,
    },
    totalTargeted: 24,
    dedupedCount: 4,
    excludedNoConsentCount: 2,
    sentCount: 18,
    deliveredCount: 17,
    readCount: 14,
    failedCount: 1,
    createdAt: "2026-10-25T10:00:00Z",
    recipients: [
      {
        id: "rcp-101",
        campaignId: "cmp-001",
        guardianId: "33333333-3333-3333-3333-333333333301",
        guardianName: "Rajesh Sharma",
        guardianPhone: "+919820011001",
        childName: "Aarav Sharma",
        status: "read",
        sentAt: "2026-10-25T10:02:10Z",
        deliveredAt: "2026-10-25T10:02:25Z",
        readAt: "2026-10-25T10:05:40Z",
      },
      {
        id: "rcp-102",
        campaignId: "cmp-001",
        guardianId: "33333333-3333-3333-3333-333333333302",
        guardianName: "Priya Patel",
        guardianPhone: "+919820011002",
        childName: "Rudra Patel",
        status: "delivered",
        sentAt: "2026-10-25T10:02:12Z",
        deliveredAt: "2026-10-25T10:02:30Z",
      },
      {
        id: "rcp-103",
        campaignId: "cmp-001",
        guardianId: "33333333-3333-3333-3333-333333333305",
        guardianName: "Vikram Malhotra",
        guardianPhone: "+919820011005",
        childName: "Kabir Malhotra",
        status: "read",
        sentAt: "2026-10-25T10:02:14Z",
        deliveredAt: "2026-10-25T10:02:29Z",
        readAt: "2026-10-25T10:12:00Z",
      },
      {
        id: "rcp-104",
        campaignId: "cmp-001",
        guardianId: "33333333-3333-3333-3333-333333333304",
        guardianName: "Sunita Roy",
        guardianPhone: "+919820011004",
        childName: "Ananya Roy Jr.",
        status: "failed",
        sentAt: "2026-10-25T10:02:15Z",
        errorMessage: "Network route congested on mobile carrier",
      },
    ],
  },
  {
    id: "cmp-002",
    title: "Under-5 MMR & Influenza Booster Vaccine Drive",
    templateName: "immunization_due_alert",
    category: "utility",
    status: "completed",
    targetCriteria: {
      minAgeYears: 0,
      maxAgeYears: 5,
      gender: "all",
      visitedWithinDays: 180,
    },
    totalTargeted: 16,
    dedupedCount: 3,
    excludedNoConsentCount: 1,
    sentCount: 12,
    deliveredCount: 12,
    readCount: 10,
    failedCount: 0,
    createdAt: "2026-10-20T14:30:00Z",
    recipients: [
      {
        id: "rcp-201",
        campaignId: "cmp-002",
        guardianId: "33333333-3333-3333-3333-333333333302",
        guardianName: "Priya Patel",
        guardianPhone: "+919820011002",
        childName: "Rudra Patel",
        status: "read",
        sentAt: "2026-10-20T14:31:00Z",
        deliveredAt: "2026-10-20T14:31:15Z",
        readAt: "2026-10-20T14:40:22Z",
      },
    ],
  },
];

export async function fetchAllCampaigns(): Promise<CampaignDetail[]> {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("campaigns")
        .select(`
          id,
          title,
          template_id,
          status,
          audience_criteria,
          total_target,
          sent_count,
          delivered_count,
          read_count,
          failed_count,
          created_at,
          recipients:campaign_recipients(*)
        `)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const rows = data as unknown as SupabaseCampaignRaw[];
        return rows.map((c) => ({
          id: c.id,
          title: c.title,
          templateName: c.template_id || "seasonal_pediatric_camp",
          category: "marketing",
          status: c.status,
          targetCriteria: c.audience_criteria || {},
          totalTargeted: c.total_target || 0,
          dedupedCount: 0,
          excludedNoConsentCount: 0,
          sentCount: c.sent_count || 0,
          deliveredCount: c.delivered_count || 0,
          readCount: c.read_count || 0,
          failedCount: c.failed_count || 0,
          createdAt: c.created_at,
          recipients: (c.recipients || []).map((r) => ({
            id: r.id,
            campaignId: r.campaign_id,
            guardianId: r.guardian_id,
            guardianName: "Guardian",
            guardianPhone: "",
            childName: "Child",
            status: r.status,
            errorMessage: r.error_reason || undefined,
          })),
        }));
      }
    } catch {
      // fallback
    }
  }

  return inMemoryCampaigns;
}

export async function fetchCampaignById(id: string): Promise<CampaignDetail | null> {
  const all = await fetchAllCampaigns();
  return all.find((c) => c.id === id) || null;
}

export async function createAndDispatchCampaign({
  title,
  templateName,
  category = "marketing",
  criteria,
  audienceRecipients,
  stats,
}: {
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
}): Promise<CampaignDetail> {
  const campaignId = `cmp-${Date.now()}`;
  let sentCount = 0;
  let deliveredCount = 0;
  let failedCount = 0;

  const recipients: CampaignRecipientDetail[] = [];

  // Dispatch in batches with rate-limiting simulation
  for (const recipient of audienceRecipients) {
    const res = await whatsappProvider.sendTemplateMessage(
      recipient.guardianPhone,
      templateName,
      {
        guardian_name: recipient.guardianName,
        patient_name: recipient.childName,
      }
    );

    const isSuccess = res.success;
    if (isSuccess) {
      sentCount++;
      deliveredCount++; // Mock auto-delivers
    } else {
      failedCount++;
    }

    recipients.push({
      id: `rcp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      campaignId,
      guardianId: recipient.guardianId,
      guardianName: recipient.guardianName,
      guardianPhone: recipient.guardianPhone,
      childName: recipient.childName,
      status: isSuccess ? "delivered" : "failed",
      sentAt: new Date().toISOString(),
      deliveredAt: isSuccess ? new Date().toISOString() : undefined,
      errorMessage: res.error,
    });
  }

  const newCampaign: CampaignDetail = {
    id: campaignId,
    title,
    templateName,
    category,
    status: "completed",
    targetCriteria: criteria,
    totalTargeted: stats.totalTargeted,
    dedupedCount: stats.dedupedCount,
    excludedNoConsentCount: stats.excludedNoConsentCount,
    sentCount,
    deliveredCount,
    readCount: Math.round(deliveredCount * 0.7), // Simulated 70% read rate
    failedCount,
    createdAt: new Date().toISOString(),
    recipients,
  };

  inMemoryCampaigns.unshift(newCampaign);

  // If Supabase is configured, record in database
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      await supabase.from("campaigns").insert({
        id: campaignId,
        title,
        template_id: templateName,
        status: "completed",
        audience_criteria: criteria as Record<string, unknown>,
        total_target: stats.totalTargeted,
        sent_count: sentCount,
        delivered_count: deliveredCount,
        read_count: Math.round(deliveredCount * 0.7),
        failed_count: failedCount,
      });

      const recipientRows = recipients.map((r) => ({
        campaign_id: campaignId,
        guardian_id: r.guardianId,
        status: r.status,
        error_reason: r.errorMessage || null,
      }));

      await supabase.from("campaign_recipients").insert(recipientRows);
    } catch {
      // fallback
    }
  }

  return newCampaign;
}

export async function retryFailedCampaignRecipients(
  campaignId: string
): Promise<{ success: boolean; retriedCount: number }> {
  const campaign = inMemoryCampaigns.find((c) => c.id === campaignId);
  if (!campaign) return { success: false, retriedCount: 0 };

  let retried = 0;
  for (const r of campaign.recipients) {
    if (r.status === "failed") {
      const res = await whatsappProvider.sendTemplateMessage(
        r.guardianPhone,
        campaign.templateName,
        {
          guardian_name: r.guardianName,
          patient_name: r.childName,
        }
      );

      if (res.success) {
        r.status = "delivered";
        r.errorMessage = undefined;
        r.sentAt = new Date().toISOString();
        r.deliveredAt = new Date().toISOString();
        campaign.failedCount = Math.max(0, campaign.failedCount - 1);
        campaign.sentCount++;
        campaign.deliveredCount++;
        retried++;
      }
    }
  }

  return { success: true, retriedCount: retried };
}
