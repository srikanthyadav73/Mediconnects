import { fetchAllMessages } from "@/lib/messages-store";
import { fetchAllPatients } from "@/lib/patients-data";
import { isWhatsAppMock } from "@/lib/env";
import { MessagesClient } from "./messages-client";

export const metadata = {
  title: "WhatsApp Messaging Center | MediConnect Children's Hospital",
};

export default async function MessagesPage() {
  const [messages, patients] = await Promise.all([
    fetchAllMessages(),
    fetchAllPatients(),
  ]);

  return (
    <MessagesClient
      initialMessages={messages}
      patients={patients}
      isWhatsAppMock={isWhatsAppMock}
    />
  );
}

