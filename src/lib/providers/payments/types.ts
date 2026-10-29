export interface CreatePaymentLinkParams {
  visitId: string;
  invoiceId: string;
  amount: number; // in INR
  patientName: string;
  guardianPhone: string;
  description: string;
}

export interface PaymentLinkResponse {
  id: string;
  shortUrl: string;
  status: "created" | "paid" | "expired";
  isMock: boolean;
}

export interface VerifyWebhookSignatureParams {
  body: string;
  signature: string;
  secret: string;
}

export interface PaymentProvider {
  name: string;
  isMock: boolean;
  createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResponse>;
  verifyWebhookSignature(params: VerifyWebhookSignatureParams): boolean;
}

