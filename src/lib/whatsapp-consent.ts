import type { ConsentStatus } from "@/types/database";

export interface ConsentRecord {
  id?: string;
  guardianId: string;
  status: ConsentStatus;
  source?: string;
  createdAt: string;
}

/**
 * Checks whether a guardian currently has active WhatsApp consent.
 * The rule is strictly: latest record in chronological order must be 'opted_in'.
 * If no record exists or latest is 'opted_out', return false.
 */
export function hasValidWhatsAppConsent(records: ConsentRecord[]): boolean {
  if (!records || records.length === 0) {
    return false;
  }

  // Sort chronological ascending so last element is the newest
  const sorted = [...records].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const latest = sorted[sorted.length - 1];
  return latest.status === "opted_in";
}

/**
 * Prohibited clinical diagnostic phrases that must never be transmitted via WhatsApp
 * to protect pediatric patient confidentiality and adhere to privacy guidelines.
 */
const SENSITIVE_CLINICAL_KEYWORDS = [
  "diagnosis",
  "diagnosed with",
  "suffering from",
  "infection",
  "pneumonia",
  "asthma attack",
  "bronchitis",
  "seizure",
  "epilepsy",
  "dengue",
  "malaria",
  "typhoid",
  "hiv",
  "tuberculosis",
  "malignancy",
  "tumor",
  "psychiatric",
];

/**
 * Prepares and renders a WhatsApp template while strictly stripping out any diagnosis
 * or sensitive clinical details to ensure compliance with healthcare messaging standards.
 */
export function prepareAndSanitizeWhatsAppMessage(
  templatePattern: string,
  parameters: Record<string, string>
): {
  sanitizedText: string;
  strippedClinicalData: boolean;
} {
  let text = templatePattern;
  let strippedClinicalData = false;

  for (const [key, rawValue] of Object.entries(parameters)) {
    let safeValue = rawValue;

    // If parameter key mentions diagnosis or value contains sensitive health data, sanitize it
    if (key.toLowerCase().includes("diagnosis") || key.toLowerCase().includes("condition")) {
      strippedClinicalData = true;
      safeValue = "routine clinical consultation";
    } else {
      for (const kw of SENSITIVE_CLINICAL_KEYWORDS) {
        const regex = new RegExp(`\\b${kw}\\b`, "gi");
        if (regex.test(safeValue)) {
          strippedClinicalData = true;
          safeValue = safeValue.replace(regex, "pediatric consultation");
        }
      }
    }

    // Replace both {{key}} and {{1}}, {{2}} style placeholders
    text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), safeValue);
  }

  return {
    sanitizedText: text,
    strippedClinicalData,
  };
}

