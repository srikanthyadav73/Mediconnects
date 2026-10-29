import { NextResponse } from "next/server";
import { paymentProvider } from "@/lib/providers/payments";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { visitId, invoiceId, amount, patientName, guardianPhone, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount greater than zero is required." },
        { status: 400 }
      );
    }

    const result = await paymentProvider.createPaymentLink({
      visitId: visitId || `vis_general_${Date.now()}`,
      invoiceId: invoiceId || `inv_general_${Date.now()}`,
      amount: Number(amount),
      patientName: patientName || "Pediatric Patient",
      guardianPhone: guardianPhone || "+919820011001",
      description: description || "CareBridge Hospital Consultation & Pharmacy",
    });

    return NextResponse.json({
      success: true,
      paymentId: result.id,
      shortUrl: result.shortUrl,
      isMock: result.isMock,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create payment link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

