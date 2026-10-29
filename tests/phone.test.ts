import { describe, it, expect } from "vitest";
import {
  normalizeIndianPhone,
  isValidIndianMobile,
  formatPhoneDisplay,
} from "@/lib/validators/phone";

describe("Indian Phone Normalization & Validation (+91 E.164)", () => {
  it("normalizes a standard 10-digit Indian mobile number", () => {
    const input = "9820011001";
    const result = normalizeIndianPhone(input);
    expect(result).toBe("+919820011001");
    expect(isValidIndianMobile(input)).toBe(true);
  });

  it("handles numbers with spaces, hyphens, and leading zero", () => {
    const input = "098200 11002";
    const result = normalizeIndianPhone(input);
    expect(result).toBe("+919820011002");
    expect(isValidIndianMobile(input)).toBe(true);
  });

  it("handles numbers already with +91 country prefix", () => {
    const input = "+91 98200-11003";
    const result = normalizeIndianPhone(input);
    expect(result).toBe("+919820011003");
    expect(isValidIndianMobile(input)).toBe(true);
  });

  it("rejects invalid length numbers", () => {
    expect(normalizeIndianPhone("12345")).toBeNull();
    expect(isValidIndianMobile("12345")).toBe(false);
  });

  it("rejects numbers starting with invalid digits for Indian mobile", () => {
    // Landlines or invalid prefixes
    expect(isValidIndianMobile("+912226548900")).toBe(false);
  });

  it("formats phone for friendly Indian display", () => {
    expect(formatPhoneDisplay("+919820011001")).toBe("+91 98200 11001");
  });
});
