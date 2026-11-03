import { getCurrentUser } from "@/lib/auth";
import {
  getHospitalProfile,
  getTariffServices,
  getStaffUsers,
  getAuditLogs,
  getAppointmentMessageSettings,
} from "@/lib/settings-store";
import { SettingsClient } from "./settings-client";

export const metadata = {
  title: "Hospital Settings & Administration | MediConnect Children's Hospital",
};

export default async function SettingsPage() {
  const [currentUser, profile, tariffs, staff, auditLogs, appointmentSettings] = await Promise.all([
    getCurrentUser(),
    getHospitalProfile(),
    getTariffServices(),
    getStaffUsers(),
    getAuditLogs(),
    getAppointmentMessageSettings(),
  ]);

  return (
    <SettingsClient
      currentUser={currentUser}
      initialProfile={profile}
      initialTariffs={tariffs}
      initialStaff={staff}
      auditLogs={auditLogs}
      initialAppointmentSettings={appointmentSettings}
    />
  );
}
