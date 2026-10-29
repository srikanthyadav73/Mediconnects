import type { InvoiceStatus } from "@/types/database";

export interface BillableItem {
  quantity: number;
  unitPrice: number;
}

export function calculateInvoiceTotals(
  items: BillableItem[],
  discountAmount = 0,
  taxRatePercent = 0
) {
  const totalAmount = items.reduce(
    (sum, it) => sum + Math.max(0, it.quantity) * Math.max(0, it.unitPrice),
    0
  );
  const discount = Math.min(totalAmount, Math.max(0, discountAmount));
  const subtotalAfterDiscount = totalAmount - discount;
  const taxAmount = Math.round(((subtotalAfterDiscount * Math.max(0, taxRatePercent)) / 100) * 100) / 100;
  const netAmount = Math.round((subtotalAfterDiscount + taxAmount) * 100) / 100;

  return {
    totalAmount,
    discountAmount: discount,
    taxAmount,
    netAmount,
  };
}

export function computeInvoiceBalance(netAmount: number, payments: number[]): {
  totalPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
} {
  const totalPaid = payments.reduce((sum, p) => sum + Math.max(0, p), 0);
  const balanceDue = Math.max(0, Math.round((netAmount - totalPaid) * 100) / 100);

  let status: InvoiceStatus = "issued";
  if (totalPaid >= netAmount && netAmount > 0) {
    status = "paid";
  } else if (totalPaid > 0 && balanceDue > 0) {
    status = "partially_paid";
  }

  return {
    totalPaid,
    balanceDue,
    status,
  };
}
