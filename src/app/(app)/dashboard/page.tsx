import { getCurrentUser } from "@/lib/auth";
import { fetchAnalyticsData } from "@/lib/analytics-data";
import { DashboardClient } from "./dashboard-client";

export const metadata = {
  title: "Clinical Analytics Dashboard | CareBridge Children's Hospital",
};

export default async function DashboardPage() {
  const [user, analytics] = await Promise.all([
    getCurrentUser(),
    fetchAnalyticsData(30),
  ]);

  return <DashboardClient user={user} analytics={analytics} />;
}
