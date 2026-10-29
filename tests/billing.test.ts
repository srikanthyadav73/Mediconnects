import { describe, it, expect } from "vitest";
import { calculateInvoiceTotals, computeInvoiceBalance } from "../src/lib/billing-calculator";

describe("Billing & Invoice Calculations", () => {
  it("calculates gross total, discount, and net amount accurately", () => {
    const items = [
      { quantity: 1, unitPrice: 600 }, // Pediatric Consultation
      { quantity: 2, unitPrice: 350 }, // 2x Nebulization = 700
      { quantity: 1, unitPrice: 450 }, // Complete Blood Count
    ];
    // Total = 600 + 700 + 450 = 1750
    const result = calculateInvoiceTotals(items, 150, 0);

    expect(result.totalAmount).toBe(1750);
    expect(result.discountAmount).toBe(150);
    expect(result.taxAmount).toBe(0);
    expect(result.netAmount).toBe(1600);
  });

  it("clamps discount to total amount when discount exceeds total", () => {
    const items = [{ quantity: 1, unitPrice: 500 }];
    const result = calculateInvoiceTotals(items, 800, 0);

    expect(result.totalAmount).toBe(500);
    expect(result.discountAmount).toBe(500); // capped at total
    expect(result.netAmount).toBe(0);
  });

  it("handles tax percentage correctly if applied", () => {
    const items = [{ quantity: 1, unitPrice: 1000 }];
    const result = calculateInvoiceTotals(items, 0, 5); // 5% GST

    expect(result.totalAmount).toBe(1000);
    expect(result.taxAmount).toBe(50);
    expect(result.netAmount).toBe(1050);
  });

  it("tracks unpaid balance when no payments are made", () => {
    const netAmount = 1500;
    const balance = computeInvoiceBalance(netAmount, []);

    expect(balance.totalPaid).toBe(0);
    expect(balance.balanceDue).toBe(1500);
    expect(balance.status).toBe("issued");
  });

  it("computes partial payments and sets status to partially_paid", () => {
    const netAmount = 1500;
    const balance = computeInvoiceBalance(netAmount, [500]);

    expect(balance.totalPaid).toBe(500);
    expect(balance.balanceDue).toBe(1000);
    expect(balance.status).toBe("partially_paid");
  });

  it("marks invoice as paid when multiple installments cover full net amount", () => {
    const netAmount = 1500;
    const balance = computeInvoiceBalance(netAmount, [500, 400, 600]);

    expect(balance.totalPaid).toBe(1500);
    expect(balance.balanceDue).toBe(0);
    expect(balance.status).toBe("paid");
  });
});

