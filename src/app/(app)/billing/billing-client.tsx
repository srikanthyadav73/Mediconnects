"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Printer,
  Sparkles,
  ArrowUpRight,
  Clock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrintableReceipt } from "@/components/features/printable-receipt";
import {
  createInvoiceAction,
  recordManualPaymentAction,
  generatePaymentLinkAction,
} from "@/app/actions/billing";
import {
  HOSPITAL_SERVICES,
  type InvoiceDetail,
} from "@/types/billing";
import type { PatientDetailed } from "@/lib/patients-data";
import type { PaymentMethod } from "@/types/database";

interface BillingClientProps {
  initialInvoices: InvoiceDetail[];
  patients: PatientDetailed[];
  isRazorpayMock: boolean;
}

export function BillingClient({
  initialInvoices,
  patients,
  isRazorpayMock,
}: BillingClientProps) {
  const [invoices, setInvoices] = useState<InvoiceDetail[]>(initialInvoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals state
  const [receiptInvoice, setReceiptInvoice] = useState<InvoiceDetail | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceDetail | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [lineItems, setLineItems] = useState<
    Array<{ serviceId: string; serviceName: string; quantity: number; unitPrice: number }>
  >([
    {
      serviceId: HOSPITAL_SERVICES[0].id,
      serviceName: HOSPITAL_SERVICES[0].name,
      quantity: 1,
      unitPrice: HOSPITAL_SERVICES[0].defaultFee,
    },
  ]);
  const [discountAmount, setDiscountAmount] = useState<string>("0");

  const [linkData, setLinkData] = useState<{
    url: string;
    isMock: boolean;
    invoiceNumber: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(search.toLowerCase()) ||
      inv.patientCode.toLowerCase().includes(search.toLowerCase()) ||
      inv.guardianPhone.includes(search);

    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    return inv.status === statusFilter;
  });

  // KPI aggregates
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  const totalInvoices = invoices.length;
  const overdueCount = invoices.filter((i) => i.balanceDue > 0).length;

  // Add line item in creation modal
  const handleAddLineItem = () => {
    const firstService = HOSPITAL_SERVICES[0];
    setLineItems([
      ...lineItems,
      {
        serviceId: firstService.id,
        serviceName: firstService.name,
        quantity: 1,
        unitPrice: firstService.defaultFee,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleServiceSelect = (index: number, serviceId: string) => {
    const srv = HOSPITAL_SERVICES.find((s) => s.id === serviceId);
    if (!srv) return;
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      serviceId: srv.id,
      serviceName: srv.name,
      unitPrice: srv.defaultFee,
    };
    setLineItems(updated);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...lineItems];
    updated[index].quantity = Math.max(1, quantity);
    setLineItems(updated);
  };

  const invoiceSubtotal = lineItems.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0
  );
  const netInvoicePayable = Math.max(0, invoiceSubtotal - (parseFloat(discountAmount) || 0));

  // Handle invoice creation
  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) {
      setActionError("Please select a patient.");
      return;
    }

    startTransition(async () => {
      const res = await createInvoiceAction({
        patientId: patient.id,
        patientName: patient.fullName,
        patientCode: patient.patientCode,
        guardianName: patient.guardian.name,
        guardianPhone: patient.guardian.phone,
        items: lineItems,
        discountAmount: parseFloat(discountAmount) || 0,
      });

      if (res.success && res.invoice) {
        setInvoices([res.invoice, ...invoices]);
        setCreateOpen(false);
        setActionSuccess(`Invoice ${res.invoice.invoiceNumber} created successfully!`);
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(res.error || "Failed to create invoice");
      }
    });
  };

  // Handle manual payment recording
  const handleOpenPaymentModal = (inv: InvoiceDetail) => {
    setPaymentInvoice(inv);
    setPaymentAmount(inv.balanceDue.toString());
    setPaymentMethod("upi");
    setPaymentNotes("");
    setActionError(null);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;
    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      setActionError("Enter a valid payment amount greater than zero.");
      return;
    }

    if (amountNum > paymentInvoice.balanceDue) {
      setActionError(`Amount cannot exceed outstanding balance of ₹${paymentInvoice.balanceDue}.`);
      return;
    }

    startTransition(async () => {
      const res = await recordManualPaymentAction({
        invoiceId: paymentInvoice.id,
        visitId: paymentInvoice.visitId,
        amount: amountNum,
        method: paymentMethod,
        notes: paymentNotes,
      });

      if (res.success) {
        // Update local state
        setInvoices((prev) =>
          prev.map((i) => {
            if (i.id !== paymentInvoice.id) return i;
            const newPaid = i.paidAmount + amountNum;
            const newBalance = Math.max(0, i.netAmount - newPaid);
            const newStatus = newBalance === 0 ? "paid" : "partially_paid";
            const newPayments = [
              ...i.payments,
              {
                id: `pay-${Date.now()}`,
                amount: amountNum,
                method: paymentMethod,
                status: "paid" as const,
                createdAt: new Date().toISOString(),
              },
            ];
            return {
              ...i,
              paidAmount: newPaid,
              balanceDue: newBalance,
              status: newStatus,
              payments: newPayments,
            };
          })
        );
        setPaymentInvoice(null);
        setActionSuccess(`Recorded payment of ₹${amountNum.toFixed(2)} via ${paymentMethod.toUpperCase()}`);
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(res.error || "Failed to record payment");
      }
    });
  };

  // Generate Razorpay / Mock link
  const handleGenerateLink = async (invoiceId: string) => {
    setActionError(null);
    startTransition(async () => {
      const res = await generatePaymentLinkAction(invoiceId);
      if (res.success && res.url) {
        const inv = invoices.find((i) => i.id === invoiceId);
        setLinkData({
          url: res.url,
          isMock: !!res.isMock,
          invoiceNumber: inv?.invoiceNumber || invoiceId,
        });
      } else {
        setActionError(res.error || "Failed to generate payment link");
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Test Mode / Razorpay Alert Banner */}
      {isRazorpayMock && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-300/60 bg-amber-50/70 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 px-2.5 items-center justify-center rounded-md bg-amber-600 text-white text-xs font-bold uppercase tracking-wider">
              Test Mode
            </span>
            <div>
              <p className="text-xs font-semibold">
                Razorpay Mock Provider is Active
              </p>
              <p className="text-xs text-amber-700/90">
                Payment links route to the local simulated checkout gateway with 1-click test payments and signature-verified webhooks.
              </p>
            </div>
          </div>
          <Link
            href="/payments/mock-checkout"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors"
          >
            Launch Checkout Simulator
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {actionError}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Pediatric Billing & Revenue
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage hospital service invoices, accept offline cash/UPI payments, send Razorpay links, and generate printable receipts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Revenue Collected
            </CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Received via Cash, UPI, and Razorpay
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Outstanding Balance Due
            </CardTitle>
            <Clock className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              ₹{totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending collection across patients
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Invoices
            </CardTitle>
            <Receipt className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Invoices generated this cycle
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pending / Unpaid Bills
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{overdueCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Partially paid or unpaid invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table Container */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice #, patient, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Status:</span>
              <div className="flex bg-muted/60 p-1 rounded-lg border border-border">
                {["all", "paid", "partially_paid", "issued"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      statusFilter === st
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {st === "all"
                      ? "All"
                      : st === "partially_paid"
                      ? "Partial"
                      : st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Patient & Guardian</th>
                  <th className="py-3 px-4 text-right">Net Amount</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No invoices found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{inv.invoiceNumber}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{inv.patientName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {inv.patientCode} • {inv.guardianPhone}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-foreground">
                        ₹{inv.netAmount.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                        ₹{inv.paidAmount.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-bold">
                        {inv.balanceDue > 0 ? (
                          <span className="text-rose-600">₹{inv.balanceDue.toFixed(2)}</span>
                        ) : (
                          <span className="text-muted-foreground font-normal">₹0.00</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            inv.status === "paid"
                              ? "default"
                              : inv.status === "partially_paid"
                              ? "warning"
                              : "destructive"
                          }
                          className="capitalize text-[10px]"
                        >
                          {inv.status.replace("_", " ")}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.balanceDue > 0 && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenPaymentModal(inv)}
                                className="h-7 px-2 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Record Pay
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerateLink(inv.id)}
                                className="h-7 px-2 text-xs gap-1 border-border text-foreground hover:bg-muted"
                                title="Generate Razorpay payment link"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                Link
                              </Button>
                            </>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setReceiptInvoice(inv)}
                            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            title="View and print invoice receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Receipt
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={!!paymentInvoice} onOpenChange={(open) => !open && setPaymentInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment for {paymentInvoice?.invoiceNumber}</DialogTitle>
            <DialogDescription>
              Record offline or direct collection (Cash, UPI, Card). Partial payments are accepted.
            </DialogDescription>
          </DialogHeader>

          {paymentInvoice && (
            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-semibold">{paymentInvoice.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Net Invoice:</span>
                  <span>₹{paymentInvoice.netAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid so far:</span>
                  <span className="text-emerald-600 font-medium">₹{paymentInvoice.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-border pt-1 text-sm">
                  <span>Balance Due:</span>
                  <span className="text-rose-600">₹{paymentInvoice.balanceDue.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Payment Amount (₹) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  max={paymentInvoice.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  You may enter a partial amount to record an installment.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["upi", "cash", "card"] as PaymentMethod[]).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize transition-colors ${
                        paymentMethod === m
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Notes / Transaction Ref</label>
                <Input
                  type="text"
                  placeholder="e.g. UPI Ref / Cash register memo"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentInvoice(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Recording..." : "Confirm & Save Payment"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate New Pediatric Invoice</DialogTitle>
            <DialogDescription>
              Select patient, choose clinical services from the tariff master, and issue invoice.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Select Patient <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedPatientId}
                onValueChange={(val) => setSelectedPatientId(val)}
                required
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Choose patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.fullName} ({p.patientCode}) — {p.guardian.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Line Items */}
            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Clinical Services & Procedures
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLineItem}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Service
                </Button>
              </div>

              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border"
                  >
                    <div className="flex-1">
                      <Select
                        value={item.serviceId}
                        onValueChange={(val) => handleServiceSelect(idx, val)}
                      >
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue placeholder="Select service..." />
                        </SelectTrigger>
                        <SelectContent>
                          {HOSPITAL_SERVICES.map((srv) => (
                            <SelectItem key={srv.id} value={srv.id} className="text-xs">
                              {srv.name} (₹{srv.defaultFee})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-20">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                        className="h-8 text-xs text-center"
                        title="Quantity"
                      />
                    </div>

                    <div className="w-24 text-right font-medium text-xs text-foreground">
                      ₹{(item.quantity * item.unitPrice).toFixed(2)}
                    </div>

                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLineItem(idx)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3 rounded-lg bg-muted/60 border border-border space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal Gross:</span>
                <span>₹{invoiceSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Concession / Discount (₹):</span>
                <Input
                  type="number"
                  min="0"
                  max={invoiceSubtotal}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-28 h-7 text-xs text-right"
                />
              </div>
              <div className="flex justify-between font-bold text-sm border-t border-border pt-1 text-foreground">
                <span>Net Total Payable:</span>
                <span className="text-primary">₹{netInvoicePayable.toFixed(2)}</span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !selectedPatientId}>
                {isPending ? "Generating..." : "Generate Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Link Generated Dialog */}
      <Dialog open={!!linkData} onOpenChange={(open) => !open && setLinkData(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Payment Link Generated
            </DialogTitle>
            <DialogDescription>
              Share this secure link with the guardian via WhatsApp or SMS to collect payment online.
            </DialogDescription>
          </DialogHeader>

          {linkData && (
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs break-all font-mono">
                {linkData.url}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => copyToClipboard(linkData.url)}
                  variant="outline"
                  className="flex-1 gap-2 text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedLink ? "Copied!" : "Copy Payment Link"}
                </Button>

                {linkData.isMock && (
                  <Link
                    href={linkData.url}
                    target="_blank"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    Open Test Gateway
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Printable Receipt Modal */}
      <PrintableReceipt
        invoice={receiptInvoice}
        open={!!receiptInvoice}
        onOpenChange={(open) => !open && setReceiptInvoice(null)}
      />
    </div>
  );
}
