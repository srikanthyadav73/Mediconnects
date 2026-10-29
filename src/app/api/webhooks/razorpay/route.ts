import { NextResponse } from "next/server";
import { paymentProvider } from "@/lib/providers/payments";
import { env, isRazorpayMock } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordPaymentReceived } from "@/lib/billing-store";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || "default_webhook_secret";

    // 1. Signature Verification (Source of Truth)
    const isValid = paymentProvider.verifyWebhookSignature({
      body: rawBody,
      signature,
      secret: webhookSecret,
    });

    if (!isValid && !isRazorpayMock) {
      console.warn("❌ Razorpay Webhook Invalid Signature rejected");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    console.log("🔔 Razorpay Webhook received event:", event.event);

    if (event.event === "payment_link.paid" || event.event === "payment.captured") {
      const paymentPayload = event.payload?.payment?.entity;
      const paymentLinkPayload = event.payload?.payment_link?.entity;

      const visitId =
        paymentPayload?.notes?.visit_id || paymentLinkPayload?.notes?.visit_id;
      const invoiceId =
        paymentPayload?.notes?.invoice_id || paymentLinkPayload?.notes?.invoice_id;
      const amountPaise = paymentPayload?.amount || paymentLinkPayload?.amount || 0;
      const amountINR = amountPaise / 100;
      const razorpayPaymentId = paymentPayload?.id || "pay_mock";

      // Update in-memory / mock store
      if (invoiceId) {
        recordPaymentReceived({
          invoiceId,
          visitId,
          amount: amountINR,
          method: "razorpay",
          razorpayPaymentId,
        });
      }

      // Update Supabase Database if configured
      try {
        const supabase = createAdminClient();
        if (invoiceId) {
          // Record payment
          await supabase.from("payments").insert({
            invoice_id: invoiceId,
            visit_id: visitId || null,
            amount: amountINR,
            payment_method: "razorpay",
            status: "paid",
            razorpay_payment_id: razorpayPaymentId,
            notes: `Verified Razorpay Webhook: ${event.event}`,
          });

          // Update invoice status
          await supabase
            .from("invoices")
            .update({ status: "paid" })
            .eq("id", invoiceId);
        }
      } catch (err) {
        console.error("Database error processing payment webhook:", err);
      }
    }

    return NextResponse.json({ received: true, verified: true });
  } catch (error) {
    console.error("Razorpay webhook handler error:", error);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}

