import { env, isWhatsAppMock } from "@/lib/env";
import type {
  WhatsAppProvider,
  WhatsAppMessagePayload,
  WhatsAppSendResult,
} from "./types";

class RealWhatsAppProvider implements WhatsAppProvider {
  name = "Meta WhatsApp Cloud API (Live)";
  isMock = false;

  async sendMessage(payload: WhatsAppMessagePayload): Promise<WhatsAppSendResult> {
    const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      throw new Error("WhatsApp Cloud API credentials not configured.");
    }

    const cleanTo = payload.to.replace(/[^\d]/g, "");

    let bodyPayload: Record<string, unknown>;

    if (payload.type === "template") {
      const components = payload.parameters
        ? [
            {
              type: "body",
              parameters: Object.entries(payload.parameters).map(([, val]) => ({
                type: "text",
                text: val,
              })),
            },
          ]
        : [];

      bodyPayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "template",
        template: {
          name: payload.templateName,
          language: {
            code: payload.languageCode || "en_US",
          },
          components,
        },
      };
    } else {
      bodyPayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "text",
        text: {
          preview_url: false,
          body: payload.textBody || "",
        },
      };
    }

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(bodyPayload),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        messageId: "",
        status: "failed",
        isMock: false,
        error: `Meta WhatsApp API error: ${errText}`,
      };
    }

    const data = await res.json();
    const messageId = data?.messages?.[0]?.id || `wamid_${Date.now()}`;

    return {
      success: true,
      messageId,
      status: "sent",
      isMock: false,
    };
  }

  async sendTemplateMessage(
    recipientPhone: string,
    templateName: string,
    parameters: Record<string, string>,
    languageCode = "en_US"
  ): Promise<WhatsAppSendResult> {
    return this.sendMessage({
      to: recipientPhone,
      type: "template",
      templateName,
      parameters,
      languageCode,
    });
  }
}

class MockWhatsAppProvider implements WhatsAppProvider {
  name = "Meta WhatsApp Simulator (Mock)";
  isMock = true;

  async sendMessage(payload: WhatsAppMessagePayload): Promise<WhatsAppSendResult> {
    // Generate realistic Meta WhatsApp Message ID format
    const randomHex = Math.random().toString(16).substring(2, 10).toUpperCase();
    const messageId = `wamid.HBgL${Date.now()}${randomHex}`;

    // Verify phone is provided
    if (!payload.to) {
      return {
        success: false,
        messageId: "",
        status: "failed",
        isMock: true,
        error: "Recipient phone number is required.",
      };
    }

    // Simulate short network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      success: true,
      messageId,
      status: "sent",
      isMock: true,
    };
  }

  async sendTemplateMessage(
    recipientPhone: string,
    templateName: string,
    parameters: Record<string, string>,
    languageCode = "en_US"
  ): Promise<WhatsAppSendResult> {
    return this.sendMessage({
      to: recipientPhone,
      type: "template",
      templateName,
      parameters,
      languageCode,
    });
  }
}

export const whatsappProvider: WhatsAppProvider = isWhatsAppMock
  ? new MockWhatsAppProvider()
  : new RealWhatsAppProvider();
