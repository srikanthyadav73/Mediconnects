import { fetchAllPatients } from "@/lib/patients-data";
import { fetchAllInvoices } from "@/lib/billing-store";
import type { AudienceCandidate } from "@/lib/campaign-audience";
import { WizardClient } from "./wizard-client";

export const metadata = {
  title: "New Campaign Wizard | MediConnect Children's Hospital",
};

export default async function NewCampaignPage() {
  const [patients, invoices] = await Promise.all([
    fetchAllPatients(),
    fetchAllInvoices(),
  ]);

  // Map to candidate structures
  const candidates: AudienceCandidate[] = patients.map((p) => {
    // Find outstanding balance for this patient
    const patientInvoices = invoices.filter((i) => i.patientId === p.id);
    const balance = patientInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

    const lastVisit = p.visits.length > 0 ? p.visits[0].visitDate : undefined;

    return {
      id: p.id,
      fullName: p.fullName,
      dateOfBirth: p.dateOfBirth,
      gender: p.gender,
      guardianId: p.guardian.id,
      guardianName: p.guardian.name,
      guardianPhone: p.guardian.phone,
      hasConsent: p.guardian.whatsappConsent === "opted_in",
      lastVisitDate: lastVisit,
      outstandingBalance: balance,
    };
  });

  return <WizardClient candidates={candidates} />;
}

