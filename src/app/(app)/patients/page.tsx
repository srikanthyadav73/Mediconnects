import { fetchAllPatients } from "@/lib/patients-data";
import { PatientsClient } from "./patients-client";

export default async function PatientsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const patients = await fetchAllPatients(q);

  return <PatientsClient initialPatients={patients} initialQuery={q} />;
}
