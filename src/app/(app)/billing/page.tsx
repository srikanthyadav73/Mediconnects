import { fetchAllInvoices } from "@/lib/billing-store";
import { fetchAllPatients } from "@/lib/patients-data";
import { isRazorpayMock } from "@/lib/env";
import { BillingClient } from "./billing-client";

export const metadata = {
  title: "Billing & Invoices | CareBridge Children's Hospital",
};

export default async function BillingPage() {
  const [invoices, patients] = await Promise.all([
    fetchAllInvoices(),
    fetchAllPatients(),
  ]);

  return (
    <BillingClient
      initialInvoices={invoices}
      patients={patients}
      isRazorpayMock={isRazorpayMock}
    />
  );
}

