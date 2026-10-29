import { notFound } from "next/navigation";
import { fetchPatientById } from "@/lib/patients-data";
import { PatientProfileView } from "@/components/features/patient-profile-view";

export default async function PatientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await fetchPatientById(id);

  if (!patient) {
    notFound();
  }

  return <PatientProfileView patient={patient} />;
}

