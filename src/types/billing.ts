import type { InvoiceStatus, PaymentMethod } from "./database";

export interface HospitalServiceItem {
  id: string;
  name: string;
  category: string;
  defaultFee: number;
}

export interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  visitId?: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  guardianName: string;
  guardianPhone: string;
  items: Array<{
    serviceId: string;
    serviceName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  payments: Array<{
    id: string;
    amount: number;
    method: PaymentMethod;
    status: "paid" | "pending" | "failed";
    createdAt: string;
  }>;
}

export const HOSPITAL_SERVICES: HospitalServiceItem[] = [
  { id: "srv-1", name: "Pediatric General Consultation", category: "Consultation", defaultFee: 600.0 },
  { id: "srv-2", name: "Well-Baby & Growth Assessment", category: "Consultation", defaultFee: 800.0 },
  { id: "srv-3", name: "Pediatric Pulmonology & Allergy Review", category: "Consultation", defaultFee: 750.0 },
  { id: "srv-4", name: "MMR / DTP Vaccine Administration", category: "Immunization", defaultFee: 1200.0 },
  { id: "srv-5", name: "Influenza Quadrivalent Vaccine", category: "Immunization", defaultFee: 1800.0 },
  { id: "srv-6", name: "Nebulization Session (Pediatric)", category: "Procedure", defaultFee: 350.0 },
  { id: "srv-7", name: "Complete Blood Count (CBC Micro)", category: "Laboratory", defaultFee: 450.0 },
  { id: "srv-8", name: "Emergency Pediatric Triage & Observation", category: "Emergency", defaultFee: 1500.0 },
];

