import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processDueRemindersJob } from "@/lib/appointment-reminders";

export async function POST(request: NextRequest) {
  // CRON_SECRET Security Check
  const authHeader = request.headers.get("authorization");
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const expectedSecret = env.CRON_SECRET;

  const isAuthorized =
    authHeader === `Bearer ${expectedSecret}` || cronSecretHeader === expectedSecret;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized: Invalid CRON_SECRET" }, { status: 401 });
  }

  try {
    const summary = await processDueRemindersJob(false);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...summary,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Cron reminder dispatch error" },
      { status: 500 }
    );
  }
}
