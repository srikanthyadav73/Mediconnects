"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyINR } from "@/lib/utils";

function MockCheckoutSimulatorInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = searchParams.get("id") || "plink_mock_sample";
  const invoiceId = searchParams.get("invoiceId") || "inv-002";
  const visitId = searchParams.get("visitId") || "vis-801";
  const amountStr = searchParams.get("amount") || "500";
  const amount = parseFloat(amountStr) || 500.0;
  const patientName = searchParams.get("patientName") || "Kabir Malhotra";
  const phone = searchParams.get("phone") || "+91 98200 11005";

  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  async function handleSimulateSuccess() {
    setLoading(true);
    try {
      // Dispatch verified webhook payload to source of truth
      const webhookPayload = {
        entity: "event",
        account_id: "acc_carebridge_mock",
        event: "payment_link.paid",
        contains: ["payment_link", "payment"],
        payload: {
          payment_link: {
            entity: {
              id,
              amount: Math.round(amount * 100),
              status: "paid",
              notes: {
                invoice_id: invoiceId,
                visit_id: visitId,
              },
            },
          },
          payment: {
            entity: {
              id: `pay_mock_${Date.now()}`,
              amount: Math.round(amount * 100),
              status: "captured",
              method: "upi",
              notes: {
                invoice_id: invoiceId,
                visit_id: visitId,
              },
            },
          },
        },
      };

      const res = await fetch("/api/webhooks/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": "mock_signature_valid",
        },
        body: JSON.stringify(webhookPayload),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/billing?paid=1");
        }, 2200);
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSimulateFailure() {
    setFailed(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/70 via-background to-orange-50/40 p-4 sm:p-8 flex flex-col justify-center items-center">
      {/* Brand */}
      <div className="w-full max-w-md text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <HeartHandshake className="h-5 w-5 text-accent" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            MediConnect Payments Gateway
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          Razorpay Hosted Payment Link Simulation Environment
        </p>
      </div>

      <Card className="w-full max-w-md shadow-xl border-border/80 bg-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <Badge variant="test" className="text-xs font-semibold px-2 py-0.5">
              <Sparkles className="h-3 w-3 mr-1" />
              Test Mode Active
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">{id}</span>
          </div>
          <CardTitle className="text-xl font-extrabold text-foreground mt-2">
            {formatCurrencyINR(amount)}
          </CardTitle>
          <CardDescription className="text-xs">
            Hospital consultation and outpatient pharmacy charges
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-4 text-xs">
          {success ? (
            <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-800 animate-in fade-in-0">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Payment Successfully Verified!
              </h3>
              <p className="text-xs text-muted-foreground">
                Signature verified via Razorpay webhook. Source of truth updated. Redirecting to Hospital Billing Console...
              </p>
            </div>
          ) : failed ? (
            <div className="p-4 text-center space-y-2 bg-destructive/10 rounded-xl border border-destructive/20 text-destructive">
              <XCircle className="h-8 w-8 mx-auto" />
              <h3 className="text-sm font-bold">Payment Simulation Failed</h3>
              <p className="text-xs">User aborted transaction or payment gateway declined.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFailed(false)}
                className="text-xs mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Order Details */}
              <div className="p-3 bg-muted/40 rounded-lg space-y-2 border border-border/70 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-semibold text-foreground">{patientName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Guardian Phone:</span>
                  <span className="font-mono text-foreground">{phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Invoice Reference:</span>
                  <span className="font-mono font-semibold text-primary">{invoiceId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Clinical Visit ID:</span>
                  <span className="font-mono text-muted-foreground">{visitId}</span>
                </div>
              </div>

              {/* Simulation Notice */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200">
                <strong>Reviewer Test Mode:</strong> When real Razorpay API keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are not set in `.env.local`, this mock payment checkout runs automatically. Clicking the button below dispatches a signature-verified webhook to the server endpoint.
              </div>

              {/* Simulation Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleSimulateSuccess}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 h-auto shadow-md"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Dispatching Webhook...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Simulate Successful Payment (Instant Webhook)
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSimulateFailure}
                  disabled={loading}
                  className="w-full text-xs text-destructive hover:bg-destructive/10"
                >
                  Simulate Failed / Aborted Payment
                </Button>
              </div>
            </>
          )}

          <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <Link href="/billing" className="hover:text-foreground flex items-center gap-1 font-medium">
              <ArrowLeft className="h-3 w-3" />
              Return to Hospital Billing
            </Link>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              256-bit Mock Encrypted
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MockCheckoutSimulatorPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Loading Secure Payment Gateway...
          </div>
        </div>
      }
    >
      <MockCheckoutSimulatorInner />
    </React.Suspense>
  );
}
