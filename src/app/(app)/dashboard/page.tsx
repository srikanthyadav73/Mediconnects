import { getCurrentUser } from "@/lib/auth";
import { fetchAnalyticsData } from "@/lib/analytics-data";
import { fetchAllPatients } from "@/lib/patients-data";
import { fetchAllAppointments } from "@/app/actions/appointments";
import { DashboardClient } from "./dashboard-client";

export const metadata = {
  title: "Clinical Analytics Dashboard | MediConnect Children's Hospital",
};

export default async function DashboardPage() {
  const [user, analytics, patients, appointments] = await Promise.all([
    getCurrentUser(),
    fetchAnalyticsData(30),
    fetchAllPatients(),
    fetchAllAppointments(),
  ]);

  return (
    <DashboardClient
      user={user}
      analytics={analytics}
      patients={patients}
      appointments={appointments}
    />
  );
}
