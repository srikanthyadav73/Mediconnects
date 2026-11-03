import { fetchAllAppointments } from "@/app/actions/appointments";
import { fetchAllPatients } from "@/lib/patients-data";
import { getCurrentUser } from "@/lib/auth";
import { AppointmentsCalendarView } from "@/components/features/appointments-calendar-view";

export default async function AppointmentsPage() {
  const [appointments, patients, currentUser] = await Promise.all([
    fetchAllAppointments(),
    fetchAllPatients(),
    getCurrentUser(),
  ]);

  return (
    <AppointmentsCalendarView
      initialAppointments={appointments}
      patients={patients}
      currentUser={currentUser}
    />
  );
}
