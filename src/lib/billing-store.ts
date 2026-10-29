import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { InvoiceStatus, PaymentMethod } from "@/types/database";
import {
  type HospitalServiceItem,
  type InvoiceDetail,
  HOSPITAL_SERVICES,
} from "@/types/billing";

export { type HospitalServiceItem, type InvoiceDetail, HOSPITAL_SERVICES };

const inMemoryInvoices: InvoiceDetail[] = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2026-000001",
    visitId: "vis-101",
    patientId: "44444444-4444-4444-4444-444444444401",
    patientName: "Aarav Sharma",
    patientCode: "PT-2026-000001",
    guardianName: "Rajesh Sharma",
    guardianPhone: "+919820011001",
    items: [
      {
        serviceId: "srv-1",
        serviceName: "Pediatric General Consultation",
        quantity: 1,
        unitPrice: 600.0,
        totalPrice: 600.0,
      },
    ],
    totalAmount: 600.0,
    discountAmount: 0.0,
    taxAmount: 0.0,
    netAmount: 600.0,
    paidAmount: 600.0,
    balanceDue: 0.0,
    status: "paid",
    dueDate: "2026-10-28",
    createdAt: "2026-10-28T10:30:00Z",
    payments: [
      {
        id: "pay-101",
        amount: 600.0,
        method: "upi",
        status: "paid",
        createdAt: "2026-10-28T10:45:00Z",
      },
    ],
  },
  {
    id: "inv-002",
    invoiceNumber: "INV-2026-000002",
    visitId: "vis-801",
    patientId: "44444444-4444-4444-4444-444444444408",
    patientName: "Kabir Malhotra",
    patientCode: "PT-2026-000008",
    guardianName: "Vikram Malhotra",
    guardianPhone: "+919820011005",
    items: [
      {
        serviceId: "srv-1",
        serviceName: "Pediatric General Consultation",
        quantity: 1,
        unitPrice: 600.0,
        totalPrice: 600.0,
      },
      {
        serviceId: "srv-6",
        serviceName: "Nebulization Session (Pediatric)",
        quantity: 1,
        unitPrice: 350.0,
        totalPrice: 350.0,
      },
    ],
    totalAmount: 950.0,
    discountAmount: 0.0,
    taxAmount: 0.0,
    netAmount: 950.0,
    paidAmount: 450.0,
    balanceDue: 500.0, // Outstanding balance!
    status: "partially_paid",
    dueDate: "2026-10-22",
    createdAt: "2026-10-22T15:30:00Z",
    payments: [
      {
        id: "pay-801",
        amount: 450.0,
        method: "cash",
        status: "paid",
        createdAt: "2026-10-22T15:45:00Z",
      },
    ],
  },
  {
    id: "inv-003",
    invoiceNumber: "INV-2026-000003",
    visitId: "vis-301",
    patientId: "44444444-4444-4444-4444-444444444403",
    patientName: "Rudra Patel",
    patientCode: "PT-2026-000003",
    guardianName: "Priya Patel",
    guardianPhone: "+919820011002",
    items: [
      {
        serviceId: "srv-1",
        serviceName: "Pediatric General Consultation",
        quantity: 1,
        unitPrice: 600.0,
        totalPrice: 600.0,
      },
      {
        serviceId: "srv-4",
        serviceName: "MMR / DTP Vaccine Administration",
        quantity: 1,
        unitPrice: 1200.0,
        totalPrice: 1200.0,
      },
    ],
    totalAmount: 1800.0,
    discountAmount: 0.0,
    taxAmount: 0.0,
    netAmount: 1800.0,
    paidAmount: 0.0,
    balanceDue: 1800.0, // Full balance due!
    status: "issued",
    dueDate: "2026-10-25",
    createdAt: "2026-10-25T14:00:00Z",
    payments: [],
  },
];

interface SupabaseInvoiceRaw {
  id: string;
  invoice_number: string;
  visit_id: string | null;
  patient_id: string;
  guardian_id: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  status: InvoiceStatus;
  due_date: string;
  created_at: string;
  patient: { full_name: string; patient_code: string } | null;
  guardian: { name: string; phone: string } | null;
  items: Array<{
    service_id: string | null;
    service_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }> | null;
  payments: Array<{
    id: string;
    amount: number;
    payment_method: PaymentMethod;
    status: "paid" | "pending" | "failed";
    created_at: string;
  }> | null;
}

export async function fetchAllInvoices(): Promise<InvoiceDetail[]> {
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          visit_id,
          patient_id,
          guardian_id,
          total_amount,
          discount_amount,
          tax_amount,
          net_amount,
          status,
          due_date,
          created_at,
          patient:patients(full_name, patient_code),
          guardian:guardians(name, phone),
          items:invoice_items(*),
          payments:payments(*)
        `)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const rows = data as unknown as SupabaseInvoiceRaw[];
        return rows.map((inv) => {
          const totalPaid = (inv.payments || [])
            .filter((p) => p.status === "paid")
            .reduce((sum, p) => sum + Number(p.amount), 0);
          const net = Number(inv.net_amount);
          return {
            id: inv.id,
            invoiceNumber: inv.invoice_number,
            visitId: inv.visit_id || undefined,
            patientId: inv.patient_id,
            patientName: inv.patient?.full_name || "Patient",
            patientCode: inv.patient?.patient_code || "PT-2026-000000",
            guardianName: inv.guardian?.name || "Guardian",
            guardianPhone: inv.guardian?.phone || "",
            items: (inv.items || []).map((it) => ({
              serviceId: it.service_id || "srv-custom",
              serviceName: it.service_name,
              quantity: it.quantity,
              unitPrice: Number(it.unit_price),
              totalPrice: Number(it.total_price),
            })),
            totalAmount: Number(inv.total_amount),
            discountAmount: Number(inv.discount_amount),
            taxAmount: Number(inv.tax_amount),
            netAmount: net,
            paidAmount: totalPaid,
            balanceDue: Math.max(0, net - totalPaid),
            status: inv.status,
            dueDate: inv.due_date,
            createdAt: inv.created_at,
            payments: (inv.payments || []).map((p) => ({
              id: p.id,
              amount: Number(p.amount),
              method: p.payment_method,
              status: p.status,
              createdAt: p.created_at,
            })),
          };
        });
      }
    } catch {
      // fallback
    }
  }

  return inMemoryInvoices;
}

export function recordPaymentReceived(data: {
  invoiceId: string;
  visitId?: string;
  amount: number;
  method: PaymentMethod;
  razorpayPaymentId?: string;
}) {
  const inv = inMemoryInvoices.find((i) => i.id === data.invoiceId);
  if (!inv) return;

  const newPayment = {
    id: `pay-${Date.now()}`,
    amount: data.amount,
    method: data.method,
    status: "paid" as const,
    createdAt: new Date().toISOString(),
  };

  inv.payments.push(newPayment);
  inv.paidAmount += data.amount;
  inv.balanceDue = Math.max(0, inv.netAmount - inv.paidAmount);

  if (inv.balanceDue <= 0) {
    inv.status = "paid";
  } else {
    inv.status = "partially_paid";
  }
}

export async function createNewInvoice(data: {
  patientId: string;
  patientName: string;
  patientCode: string;
  guardianName: string;
  guardianPhone: string;
  visitId?: string;
  items: Array<{ serviceId: string; serviceName: string; quantity: number; unitPrice: number }>;
  discountAmount?: number;
}) {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `INV-2026-00${randomNum}`;

  const calculatedItems = data.items.map((it) => ({
    ...it,
    totalPrice: it.quantity * it.unitPrice,
  }));

  const total = calculatedItems.reduce((acc, it) => acc + it.totalPrice, 0);
  const discount = data.discountAmount || 0;
  const net = Math.max(0, total - discount);

  const newInv: InvoiceDetail = {
    id: `inv-${Date.now()}`,
    invoiceNumber,
    visitId: data.visitId,
    patientId: data.patientId,
    patientName: data.patientName,
    patientCode: data.patientCode,
    guardianName: data.guardianName,
    guardianPhone: data.guardianPhone,
    items: calculatedItems,
    totalAmount: total,
    discountAmount: discount,
    taxAmount: 0.0,
    netAmount: net,
    paidAmount: 0.0,
    balanceDue: net,
    status: "issued",
    dueDate: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
    payments: [],
  };

  inMemoryInvoices.unshift(newInv);
  return newInv;
}
