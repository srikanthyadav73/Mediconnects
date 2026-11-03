import { getCurrentUser } from "@/lib/auth";
import {
  getHospitalProfile,
  getTariffServices,
  getStaffUsers,
  getAuditLogs,
} from "@/lib/settings-store";
import { SettingsClient } from "./settings-client";

export const metadata = {
  title: "Hospital Settings & Administration | MediConnect Children's Hospital",
};

export default async function SettingsPage() {
  const [currentUser, profile, tariffs, staff, auditLogs] = await Promise.all([
    getCurrentUser(),
    getHospitalProfile(),
    getTariffServices(),
    getStaffUsers(),
    getAuditLogs(),
  ]);

  return (
    <SettingsClient
      currentUser={currentUser}
      initialProfile={profile}
      initialTariffs={tariffs}
      initialStaff={staff}
      auditLogs={auditLogs}
    />
  );
}

