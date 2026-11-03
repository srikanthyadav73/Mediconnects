import type { MessageStatus, MessageCategory, MessageType } from "./database";

export type { MessageType };

export interface MessageTemplateItem {
  id: string;
  name: string;
  category: MessageCategory;
  language: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  headerText?: string;
  bodyText: string;
  footerText?: string;
  variables?: string[];
  buttons?: Array<{ type: "QUICK_REPLY" | "URL"; text: string; url?: string }>;
}

export interface MessageLogEntry {
  id: string;
  guardianId: string;
  guardianName: string;
  guardianPhone: string;
  patientName: string;
  templateName: string;
  messageBody: string;
  status: MessageStatus;
  providerMessageId?: string;
  isMock?: boolean;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
  appointmentId?: string | null;
  messageType?: MessageType | null;
  scheduledFor?: string | null;
  dedupeKey?: string | null;
  skipReason?: string | null;
  attempts?: number;
  lastError?: string | null;
}

export const APPROVED_TEMPLATES: MessageTemplateItem[] = [
  {
    id: "tpl-1",
    name: "appointment_reminder_24h",
    category: "utility",
    language: "en_US",
    status: "APPROVED",
    headerText: "MediConnect Children's Hospital",
    bodyText:
      "Dear {{guardian_name}}, this is a reminder that {{patient_name}} has an appointment with {{doctor_name}} tomorrow, {{date}} at {{time}}. Please arrive 10 minutes prior for vitals check.",
    footerText: "Reply 1 to Confirm, or call 1800-200-KIDS to reschedule",
    buttons: [
      { type: "QUICK_REPLY", text: "Confirm (1)" },
      { type: "QUICK_REPLY", text: "Reschedule" },
    ],
  },
  {
    id: "tpl-2",
    name: "appointment_reminder_2h",
    category: "utility",
    language: "en_US",
    status: "APPROVED",
    headerText: "MediConnect Clinic Update",
    bodyText:
      "Hello {{guardian_name}}, {{patient_name}}'s appointment with {{doctor_name}} is in 2 hours at {{time}}. Report directly to Pediatric OPD Counter 2.",
    footerText: "MediConnect 24x7 Pediatric Care",
    buttons: [{ type: "URL", text: "Hospital Directions", url: "https://mediconnect.in/maps" }],
  },
  {
    id: "tpl-3",
    name: "follow_up_visit_notice",
    category: "utility",
    language: "en_US",
    status: "APPROVED",
    headerText: "Doctor Follow-up Advisory",
    bodyText:
      "Dear {{guardian_name}}, Dr. {{doctor_name}} suggested a pediatric review for {{patient_name}} around {{date}}. Timely follow-ups ensure healthy recovery.",
    footerText: "MediConnect Children's Care",
    buttons: [{ type: "URL", text: "Book Follow-up Slot", url: "https://mediconnect.in/book" }],
  },
  {
    id: "tpl-4",
    name: "medication_reminder",
    category: "utility",
    language: "en_US",
    status: "APPROVED",
    headerText: "Prescription Care Alert",
    bodyText:
      "Friendly reminder for {{patient_name}}: Please administer prescribed doses of {{medication_name}} as directed by your pediatrician. Stay well!",
    footerText: "MediConnect Pharmacy Desk",
  },
  {
    id: "tpl-5",
    name: "immunization_due_alert",
    category: "utility",
    language: "en_US",
    status: "APPROVED",
    headerText: "Child Immunization Reminder",
    bodyText:
      "Dear {{guardian_name}}, {{patient_name}}'s {{vaccine_name}} is due on {{date}}. Keep your child shielded from preventable illnesses.",
    footerText: "National Immunization Schedule Verified",
    buttons: [{ type: "QUICK_REPLY", text: "Reserve Vaccine Dose" }],
  },
  {
    id: "tpl-6",
    name: "seasonal_pediatric_camp",
    category: "marketing",
    language: "en_US",
    status: "APPROVED",
    headerText: "Free Pediatric Health Screening",
    bodyText:
      "Join MediConnect this Saturday for our Pediatric Pulmonary & Allergy Camp. Free spirometry and senior pediatrician consultation for children aged 0-14.",
    footerText: "Reply STOP to opt out of promotional messages",
    buttons: [{ type: "QUICK_REPLY", text: "Register Child" }],
  },
  {
    id: "tpl-7",
    name: "appointment_confirmation",
    category: "utility",
    language: "en_US",
    status: "APPROVED",
    headerText: "Appointment Confirmed",
    bodyText:
      "Dear {{guardian_name}}, the appointment for {{child_first_name}} with {{doctor_name}} has been confirmed for {{date}} at {{time_slot}}. Hospital address: {{hospital_address}}.",
    footerText: "MediConnect Pediatric Console",
    variables: ["guardian_name", "child_first_name", "doctor_name", "date", "time_slot", "hospital_address"],
  },
  {
    id: "tpl-8",
    name: "appointment_reminder",
    category: "utility",
    language: "en_US",
    status: "APPROVED",
    headerText: "Appointment Reminder",
    bodyText:
      "Dear {{guardian_name}}, this is a reminder for {{child_first_name}}'s appointment with {{doctor_name}} on {{date}} at {{time_slot}}. Hospital address: {{hospital_address}}.",
    footerText: "MediConnect Pediatric Console",
    variables: ["guardian_name", "child_first_name", "doctor_name", "date", "time_slot", "hospital_address"],
  },
  {
    id: "tpl-9",
    name: "appointment_cancelled",
    category: "utility",
    language: "en_US",
    status: "APPROVED",
    headerText: "Appointment Cancelled",
    bodyText:
      "Dear {{guardian_name}}, the appointment for {{child_first_name}} with {{doctor_name}} scheduled on {{date}} at {{time_slot}} has been cancelled. Hospital address: {{hospital_address}}.",
    footerText: "MediConnect Pediatric Console",
    variables: ["guardian_name", "child_first_name", "doctor_name", "date", "time_slot", "hospital_address"],
  },
  {
    id: "tpl-10",
    name: "appointment_rescheduled",
    category: "utility",
    language: "en_US",
    status: "APPROVED",
    headerText: "Appointment Rescheduled",
    bodyText:
      "Dear {{guardian_name}}, the appointment for {{child_first_name}} with {{doctor_name}} has been rescheduled to {{date}} at {{time_slot}}. Hospital address: {{hospital_address}}.",
    footerText: "MediConnect Pediatric Console",
    variables: ["guardian_name", "child_first_name", "doctor_name", "date", "time_slot", "hospital_address"],
  },
];
