import { parsePhoneNumberWithError, isValidPhoneNumber } from "libphonenumber-js";

/**
 * Normalizes an Indian mobile phone number into strict E.164 format (+91XXXXXXXXXX).
 * Throws or returns null if invalid.
 */
export function normalizeIndianPhone(input: string): string | null {
  if (!input) return null;

  const trimmed = input.trim().replace(/[\s\-()]/g, "");

  try {
    // If user enters 10 digits without country code, default to IN (+91)
    if (/^\d{10}$/.test(trimmed)) {
      const parsed = parsePhoneNumberWithError(`+91${trimmed}`, "IN");
      if (parsed.isValid() && parsed.country === "IN") {
        return parsed.number;
      }
    }

    if (isValidPhoneNumber(trimmed, "IN")) {
      const parsed = parsePhoneNumberWithError(trimmed, "IN");
      if (parsed.isValid()) {
        return parsed.number;
      }
    }

    // Try standard parse
    const parsed = parsePhoneNumberWithError(trimmed);
    if (parsed.isValid()) {
      return parsed.number;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validates if the phone number is a valid Indian mobile number.
 */
export function isValidIndianMobile(input: string): boolean {
  const normalized = normalizeIndianPhone(input);
  if (!normalized) return false;

  // Must be +91 followed by 10 digits starting with 6, 7, 8, or 9
  return /^\+91[6-9]\d{9}$/.test(normalized);
}

/**
 * Formats an E.164 phone number for clean Indian display (e.g. "+91 98200 11001")
 */
export function formatPhoneDisplay(e164: string): string {
  if (!e164) return "";
  if (e164.startsWith("+91") && e164.length === 13) {
    return `+91 ${e164.slice(3, 8)} ${e164.slice(8)}`;
  }
  return e164;
}
