export interface WhatsAppMessagePayload {
  to: string; // E.164 phone number
  type: "template" | "text";
  templateName?: string;
  languageCode?: string;
  parameters?: Record<string, string>;
  textBody?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId: string;
  status: "queued" | "sent" | "failed";
  isMock: boolean;
  error?: string;
}

export interface WhatsAppProvider {
  readonly name: string;
  readonly isMock: boolean;

  sendMessage(payload: WhatsAppMessagePayload): Promise<WhatsAppSendResult>;
  sendTemplateMessage(
    recipientPhone: string,
    templateName: string,
    parameters: Record<string, string>,
    languageCode?: string
  ): Promise<WhatsAppSendResult>;
}
