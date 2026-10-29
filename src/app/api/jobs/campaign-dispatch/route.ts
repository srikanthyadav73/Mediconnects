import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { fetchAllCampaigns, retryFailedCampaignRecipients } from "@/lib/campaigns-store";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const expectedSecret = env.CRON_SECRET;

  const isAuthorized =
    authHeader === `Bearer ${expectedSecret}` || cronSecretHeader === expectedSecret;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized: Invalid CRON_SECRET" }, { status: 401 });
  }

  try {
    const campaigns = await fetchAllCampaigns();
    let retriedTotal = 0;

    for (const cmp of campaigns) {
      if (cmp.failedCount > 0) {
        const res = await retryFailedCampaignRecipients(cmp.id);
        retriedTotal += res.retriedCount;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      retriedRecipients: retriedTotal,
      activeCampaignsCount: campaigns.length,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Campaign dispatch job error" },
      { status: 500 }
    );
  }
}
