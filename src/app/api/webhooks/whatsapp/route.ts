import { NextRequest, NextResponse } from "next/server";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { updateMessageStatusByProviderId } from "@/lib/messages-store";
import type { MessageStatus } from "@/types/database";

/**
 * GET Handler: Meta WhatsApp Webhook Verification Handshake
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
}

/**
 * POST Handler: Meta WhatsApp Status Updates & Incoming Inbound Messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value) continue;

        // 1. Process Message Status Updates (sent, delivered, read, failed)
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const statusUpdate of value.statuses) {
            const providerMsgId = statusUpdate.id;
            const metaStatus = statusUpdate.status as string; // 'sent' | 'delivered' | 'read' | 'failed'
            const validStatus: MessageStatus =
              metaStatus === "delivered" ||
              metaStatus === "read" ||
              metaStatus === "sent" ||
              metaStatus === "failed"
                ? metaStatus
                : "sent";

            updateMessageStatusByProviderId(providerMsgId, validStatus);

            if (isSupabaseConfigured) {
              const supabase = await createClient();
              const updateData: { status: MessageStatus; delivered_at?: string; read_at?: string } = {
                status: validStatus,
              };
              if (validStatus === "delivered") updateData.delivered_at = new Date().toISOString();
              if (validStatus === "read") updateData.read_at = new Date().toISOString();

              await supabase
                .from("messages")
                .update(updateData)
                .eq("provider_message_id", providerMsgId);
            }
          }
        }

        // 2. Process Incoming Messages from Parents (e.g. STOP to opt-out, START to opt-in)
        if (value.messages && Array.isArray(value.messages)) {
          for (const incoming of value.messages) {
            const rawPhone = incoming.from || "";
            const formattedPhone = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;
            const textBody = (incoming.text?.body || "").trim().toUpperCase();

            if (["STOP", "UNSUBSCRIBE", "OPTOUT", "CANCEL"].includes(textBody)) {
              // Opt-out parent from future WhatsApp messages
              if (isSupabaseConfigured) {
                const supabase = await createClient();
                const { data: guardian } = await supabase
                  .from("guardians")
                  .select("id")
                  .eq("phone", formattedPhone)
                  .single();

                if (guardian?.id) {
                  await supabase.from("consents").insert({
                    guardian_id: guardian.id,
                    channel: "whatsapp",
                    status: "opted_out",
                    source: "chat_reply_stop",
                  });
                }
              }
            } else if (["START", "UNSTOP", "OPTIN"].includes(textBody)) {
              // Opt-in parent back
              if (isSupabaseConfigured) {
                const supabase = await createClient();
                const { data: guardian } = await supabase
                  .from("guardians")
                  .select("id")
                  .eq("phone", formattedPhone)
                  .single();

                if (guardian?.id) {
                  await supabase.from("consents").insert({
                    guardian_id: guardian.id,
                    channel: "whatsapp",
                    status: "opted_in",
                    source: "chat_reply_start",
                  });
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "processed" }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal Webhook Error" },
      { status: 500 }
    );
  }
}
