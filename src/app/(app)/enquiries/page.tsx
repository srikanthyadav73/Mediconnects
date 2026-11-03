import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { EnquiriesClient, type EnquiryItem } from "./enquiries-client";

const sampleEnquiries: EnquiryItem[] = [
  {
    id: "enq-1",
    child_name: "Tanmay Verma",
    child_dob: "2023-05-15",
    parent_name: "Amitabh Verma",
    phone: "+919820011003",
    email: "amitabh.v@example.com",
    preferred_date: "2026-11-02",
    department_or_reason: "Night cough, restless breathing, mild fever for 2 days",
    whatsapp_consent: true,
    status: "pending",
    created_at: "2026-10-29T08:15:00Z",
  },
  {
    id: "enq-2",
    child_name: "Siya Somani",
    child_dob: "2019-07-12",
    parent_name: "Archana Somani",
    phone: "+919820011028",
    email: "archana.s@example.com",
    preferred_date: "2026-11-03",
    department_or_reason: "Vision screening and eye allergy consultation",
    whatsapp_consent: true,
    status: "contacted",
    created_at: "2026-10-28T16:40:00Z",
  },
  {
    id: "enq-3",
    child_name: "Ojas Deshmukh",
    child_dob: "2024-03-10",
    parent_name: "Ananya Deshmukh",
    phone: "+919820011006",
    email: "ananya.d@example.com",
    preferred_date: "2026-11-01",
    department_or_reason: "7-month milestone checkup and weaning nutrition advice",
    whatsapp_consent: true,
    status: "converted",
    created_at: "2026-10-27T11:20:00Z",
  },
];

export default async function EnquiriesManagementPage() {
  let enquiries = sampleEnquiries;

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("website_enquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        enquiries = data as unknown as EnquiryItem[];
      }
    } catch {
      // fallback
    }
  }

  return <EnquiriesClient initialEnquiries={enquiries} />;
}
