"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  createNewInvoice,
  recordPaymentReceived,
  fetchAllInvoices,
} from "@/lib/billing-store";
import { paymentProvider } from "@/lib/providers/payments";
import type { PaymentMethod } from "@/types/database";

export async function createInvoiceAction(formData: {
  patientId: string;
  patientName: string;
  patientCode: string;
  guardianName: string;
  guardianPhone: string;
  visitId?: string;
  items: Array<{ serviceId: string; serviceName: string; quantity: number; unitPrice: number }>;
  discountAmount?: number;
}) {
  try {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      // Generate random invoice number
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const invoiceNumber = `INV-2026-${randomNum}`;

      const total = formData.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
      const discount = formData.discountAmount || 0;
      const net = Math.max(0, total - discount);

      // We need guardian_id for the invoice
      const { data: patientData } = await supabase
        .from("patients")
        .select("guardian_id")
        .eq("id", formData.patientId)
        .single();

      if (patientData?.guardian_id) {
        const { data: invoiceData, error: invError } = await supabase
          .from("invoices")
          .insert({
            invoice_number: invoiceNumber,
            patient_id: formData.patientId,
            guardian_id: patientData.guardian_id,
            visit_id: formData.visitId || null,
            total_amount: total,
            discount_amount: discount,
            tax_amount: 0,
            net_amount: net,
            status: "issued",
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          })
          .select("id")
          .single();

        if (!invError && invoiceData?.id) {
          const lineItems = formData.items.map((it) => ({
            invoice_id: invoiceData.id,
            service_id: it.serviceId.startsWith("srv-") ? null : it.serviceId,
            service_name: it.serviceName,
            quantity: it.quantity,
            unit_price: it.unitPrice,
            total_price: it.quantity * it.unitPrice,
          }));

          await supabase.from("invoice_items").insert(lineItems);
        }
      }
    }

    // Always update in-memory store so it reflects immediately
    const created = await createNewInvoice(formData);

    revalidatePath("/billing");
    revalidatePath(`/patients/${formData.patientId}`);
    return { success: true, invoice: created };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Failed to create invoice" };
  }
}

export async function recordManualPaymentAction(formData: {
  invoiceId: string;
  visitId?: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
}) {
  try {
    if (formData.amount <= 0) {
      return { success: false, error: "Payment amount must be greater than 0" };
    }

    if (isSupabaseConfigured) {
      const supabase = await createClient();
      await supabase.from("payments").insert({
        invoice_id: formData.invoiceId,
        visit_id: formData.visitId || null,
        amount: formData.amount,
        payment_method: formData.method,
        status: "paid",
        notes: formData.notes || "Manual payment recorded",
      });
    }

    // Update in-memory store
    recordPaymentReceived({
      invoiceId: formData.invoiceId,
      visitId: formData.visitId,
      amount: formData.amount,
      method: formData.method,
    });

    revalidatePath("/billing");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Failed to record payment" };
  }
}

export async function generatePaymentLinkAction(invoiceId: string) {
  try {
    const invoices = await fetchAllInvoices();
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) {
      return { success: false, error: "Invoice not found" };
    }

    if (inv.balanceDue <= 0) {
      return { success: false, error: "This invoice is already fully paid" };
    }

    const link = await paymentProvider.createPaymentLink({
      invoiceId: inv.id,
      visitId: inv.visitId || "direct-invoice",
      patientName: inv.patientName,
      guardianPhone: inv.guardianPhone || "+919876543210",
      amount: inv.balanceDue,
      description: `Payment for CareBridge Invoice ${inv.invoiceNumber}`,
    });

    return {
      success: true,
      url: link.shortUrl,
      isMock: link.isMock,
      id: link.id,
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Failed to generate payment link" };
  }
}
