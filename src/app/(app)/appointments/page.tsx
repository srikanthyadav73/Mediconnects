import { fetchAllAppointments } from "@/app/actions/appointments";
import { fetchAllPatients } from "@/lib/patients-data";
import { fetchAllMessages } from "@/lib/messages-store";
import { getCurrentUser } from "@/lib/auth";
import { AppointmentsCalendarView } from "@/components/features/appointments-calendar-view";

export default async function AppointmentsPage() {
  const [appointments, patients, currentUser, messages] = await Promise.all([
    fetchAllAppointments(),
    fetchAllPatients(),
    getCurrentUser(),
    fetchAllMessages(),
  ]);

  return (
    <AppointmentsCalendarView
      initialAppointments={appointments}
      patients={patients}
      currentUser={currentUser}
      initialMessages={messages}
    />
  );
}
