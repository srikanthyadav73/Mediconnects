"use client";

import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, ShieldCheck } from "lucide-react";
import type { InvoiceDetail } from "@/types/billing";

interface PrintableReceiptProps {
  invoice: InvoiceDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrintableReceipt({ invoice, open, onOpenChange }: PrintableReceiptProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            <DialogTitle className="text-base font-semibold">
              Tax Invoice & Payment Receipt — {invoice.invoiceNumber}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Print Receipt
            </Button>
          </div>
        </DialogHeader>

        {/* Printable Paper Canvas */}
        <div
          ref={printAreaRef}
          id="printable-receipt"
          className="p-8 bg-white text-zinc-900 font-sans text-sm selection:bg-teal-100"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-teal-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-lg">
                  CB
                </div>
                <div>
                  <h1 className="text-2xl font-black text-teal-900 tracking-tight leading-none">
                    CareBridge Children&apos;s Hospital
                  </h1>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">
                    Center for Advanced Pediatric Care & Child Health
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-600 mt-2">
                Plot 42, Sector 5, Medical Enclave, New Delhi - 110001
              </p>
              <p className="text-xs text-zinc-500">
                GSTIN: 07AAAAA0000A1Z5 | Reg: ND-PED-2026-889 | 24x7 Helpline: 1800-200-KIDS
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 font-bold text-xs uppercase tracking-wider rounded">
                Official Medical Receipt
              </span>
              <p className="text-lg font-bold text-zinc-900 mt-2">{invoice.invoiceNumber}</p>
              <p className="text-xs text-zinc-500">
                Date: {new Date(invoice.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Patient and Invoice Info Cards */}
          <div className="grid grid-cols-2 gap-4 my-6 p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
            <div>
              <h3 className="font-bold text-teal-900 uppercase tracking-wider text-[11px] mb-1">
                Patient & Guardian
              </h3>
              <p className="font-semibold text-zinc-900 text-sm">{invoice.patientName}</p>
              <p className="text-zinc-600">Patient Code: <span className="font-mono font-bold text-zinc-800">{invoice.patientCode}</span></p>
              <p className="text-zinc-600">Guardian: {invoice.guardianName} ({invoice.guardianPhone})</p>
              {invoice.visitId && (
                <p className="text-zinc-500 mt-1">Visit Ref: {invoice.visitId}</p>
              )}
            </div>

            <div className="text-right">
              <h3 className="font-bold text-teal-900 uppercase tracking-wider text-[11px] mb-1">
                Invoice Summary
              </h3>
              <p className="text-zinc-600">
                Payment Status:{" "}
                <span className={`font-bold uppercase ${
                  invoice.status === "paid"
                    ? "text-emerald-700"
                    : invoice.status === "partially_paid"
                    ? "text-amber-700"
                    : "text-rose-700"
                }`}>
                  {invoice.status.replace("_", " ")}
                </span>
              </p>
              <p className="text-zinc-600">Due Date: {invoice.dueDate}</p>
              <p className="text-zinc-600">
                Payment Currency: <span className="font-bold text-zinc-800">INR (₹)</span>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left text-xs border border-zinc-200 mb-6">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-200">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Service / Clinical Item</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                <th className="py-2.5 px-3 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {invoice.items.map((it, idx) => (
                <tr key={idx} className="hover:bg-zinc-50">
                  <td className="py-2.5 px-3 text-zinc-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-medium text-zinc-800">{it.serviceName}</td>
                  <td className="py-2.5 px-3 text-center">{it.quantity}</td>
                  <td className="py-2.5 px-3 text-right">{it.unitPrice.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-medium">
                    {it.totalPrice.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Breakdown */}
          <div className="flex justify-end mb-6">
            <div className="w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal (Gross):</span>
                <span>₹{invoice.totalAmount.toFixed(2)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Concession / Discount:</span>
                  <span>- ₹{invoice.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-600">
                <span>Healthcare GST (Exempt):</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between font-bold text-zinc-900 border-t border-zinc-300 pt-2 text-sm">
                <span>Net Payable:</span>
                <span>₹{invoice.netAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-700">
                <span>Total Amount Paid:</span>
                <span>₹{invoice.paidAmount.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between font-bold text-sm border-t border-zinc-200 pt-1 ${
                invoice.balanceDue > 0 ? "text-rose-600" : "text-emerald-700"
              }`}>
                <span>Outstanding Balance Due:</span>
                <span>₹{invoice.balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment History section */}
          {invoice.payments.length > 0 && (
            <div className="mb-6 border-t border-zinc-200 pt-4">
              <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-2">
                Recorded Payment Receipts
              </h4>
              <div className="space-y-1">
                {invoice.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between text-xs py-1.5 px-3 rounded bg-zinc-50 border border-zinc-200"
                  >
                    <div>
                      <span className="font-mono font-medium text-zinc-700">{p.id}</span>
                      <span className="mx-2 text-zinc-400">•</span>
                      <span className="uppercase text-zinc-600 font-semibold">{p.method}</span>
                      <span className="mx-2 text-zinc-400">•</span>
                      <span className="text-zinc-500">
                        {new Date(p.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="font-bold text-emerald-700">₹{p.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer & Signature */}
          <div className="border-t border-zinc-200 pt-6 mt-8 flex justify-between items-end text-xs text-zinc-500">
            <div className="max-w-xs space-y-1">
              <p className="font-bold text-zinc-700">CareBridge Pediatric Guarantee</p>
              <p>
                Computer generated medical receipt. No physical signature required. Thank you for
                trusting CareBridge for your pediatric health needs.
              </p>
              <div className="flex items-center gap-1.5 text-teal-800 font-medium pt-1">
                <ShieldCheck className="w-4 h-4" /> Verified NABH Pediatric Healthcare Center
              </div>
            </div>

            <div className="text-center">
              <div className="w-44 border-b border-zinc-400 pb-1 mb-1 font-mono text-zinc-400">
                [Authorized Signatory]
              </div>
              <p className="font-semibold text-zinc-700">Accounts & Billing Officer</p>
              <p className="text-[10px] text-zinc-400">CareBridge Children&apos;s Hospital</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
