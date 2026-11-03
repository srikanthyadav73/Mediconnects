import { fetchAllPatients } from "@/lib/patients-data";
import { VisitsClient } from "./visits-client";

export default async function VisitsManagementPage() {
  const patients = await fetchAllPatients();

  // Flatten all visits with patient context
  const allVisits = patients
    .flatMap((p) =>
      p.visits.map((v) => ({
        ...v,
        patientId: p.id,
        patientName: p.fullName,
        patientCode: p.patientCode,
        guardianName: p.guardian.name,
        guardianPhone: p.guardian.phone,
      }))
    )
    .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

  return (
    <VisitsClient
      initialVisits={allVisits}
    />
  );
}
