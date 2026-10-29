import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function calculateAge(dob: string): string {
  if (!dob) return "";
  const birth = new Date(dob);
  const now = new Date(2026, 9, 29);
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    years--;
  }
  if (years <= 0) {
    const months = Math.max(1, (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth()));
    return `${months}m`;
  }
  return `${years}y`;
}

export function calculateAgeYears(dob: string, referenceDate: Date = new Date(2026, 9, 29)): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  let years = referenceDate.getFullYear() - birth.getFullYear();
  const m = referenceDate.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && referenceDate.getDate() < birth.getDate())) {
    years--;
  }
  return Math.max(0, years);
}
