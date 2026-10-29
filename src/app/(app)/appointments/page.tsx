import { fetchAllAppointments } from "@/app/actions/appointments";
import { fetchAllPatients } from "@/lib/patients-data";
import { AppointmentsCalendarView } from "@/components/features/appointments-calendar-view";

export default async function AppointmentsPage() {
  const [appointments, patients] = await Promise.all([
    fetchAllAppointments(),
    fetchAllPatients(),
  ]);

  return (
    <AppointmentsCalendarView
      initialAppointments={appointments}
      patients={patients}
    />
  );
}

