import crypto from "crypto";
import { env, isRazorpayMock } from "@/lib/env";
import type {
  PaymentProvider,
  CreatePaymentLinkParams,
  PaymentLinkResponse,
  VerifyWebhookSignatureParams,
} from "./types";

class RealRazorpayProvider implements PaymentProvider {
  name = "Razorpay Live";
  isMock = false;

  async createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResponse> {
    const authHeader = Buffer.from(
      `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const payload = {
      amount: Math.round(params.amount * 100), // in paise
      currency: "INR",
      description: params.description,
      customer: {
        name: params.patientName,
        contact: params.guardianPhone,
      },
      notify: {
        sms: true,
        whatsapp: true,
      },
      reminder_enable: true,
      notes: {
        visit_id: params.visitId,
        invoice_id: params.invoiceId,
      },
      callback_url: `${env.NEXT_PUBLIC_APP_URL}/billing?success=1`,
      callback_method: "get",
    };

    const res = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Razorpay API Error: ${errText}`);
    }

    const data = await res.json();
    return {
      id: data.id,
      shortUrl: data.short_url,
      status: "created",
      isMock: false,
    };
  }

  verifyWebhookSignature({ body, signature, secret }: VerifyWebhookSignatureParams): boolean {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf8"),
        Buffer.from(signature, "utf8")
      );
    } catch {
      return false;
    }
  }
}

class MockRazorpayProvider implements PaymentProvider {
  name = "Razorpay Mock Mode";
  isMock = true;

  async createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResponse> {
    const mockId = `plink_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const shortUrl = `${env.NEXT_PUBLIC_APP_URL}/payments/mock-checkout?id=${mockId}&visitId=${params.visitId}&invoiceId=${params.invoiceId}&amount=${params.amount}&patientName=${encodeURIComponent(params.patientName)}&phone=${encodeURIComponent(params.guardianPhone)}`;

    return {
      id: mockId,
      shortUrl,
      status: "created",
      isMock: true,
    };
  }

  verifyWebhookSignature({ body, signature, secret }: VerifyWebhookSignatureParams): boolean {
    if (!signature || !secret) return false;
    // In mock mode, allow mock signatures or exact hmac verification
    if (signature === "mock_signature_valid") return true;

    try {
      const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
      return expected === signature;
    } catch {
      return false;
    }
  }
}

// Export singleton instance based on whether real keys exist
export const paymentProvider: PaymentProvider = isRazorpayMock
  ? new MockRazorpayProvider()
  : new RealRazorpayProvider();

