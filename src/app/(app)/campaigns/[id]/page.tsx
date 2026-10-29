import { notFound } from "next/navigation";
import { fetchCampaignById } from "@/lib/campaigns-store";
import { CampaignResultsClient } from "./campaign-results-client";

export const metadata = {
  title: "Campaign Results & Delivery Analytics | CareBridge Children's Hospital",
};

export default async function CampaignResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await fetchCampaignById(id);

  if (!campaign) {
    notFound();
  }

  return <CampaignResultsClient initialCampaign={campaign} />;
}
