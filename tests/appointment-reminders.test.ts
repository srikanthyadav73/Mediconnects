import { describe, it, expect } from "vitest";
import {
  istToUtc,
  utcToIstParts,
  formatIstDate,
  formatIstTime,
  getAppointmentMessageDedupeKey,
  calculateReminderSchedule,
  buildAllowedTemplateVariables,
  type AppointmentContext,
} from "../src/lib/appointment-reminders";
import { prepareAndSanitizeWhatsAppMessage } from "../src/lib/whatsapp-consent";
import { APPROVED_TEMPLATES } from "../src/types/messaging";

describe("Automatic Appointment Reminders & IST Scheduling Engine", () => {
  describe("IST Timezone Precision (Asia/Kolkata, UTC+5:30)", () => {
    it("accurately converts IST date and time to UTC Date", () => {
      // 10:00 AM IST on 2026-11-04 should be 04:30 AM UTC on 2026-11-04
      const utcDate = istToUtc("2026-11-04", "10:00");
      expect(utcDate.toISOString()).toBe("2026-11-04T04:30:00.000Z");
    });

    it("accurately converts early morning IST to previous day UTC", () => {
      // 03:00 AM IST on 2026-11-04 is 09:30 PM UTC on 2026-11-03
      const utcDate = istToUtc("2026-11-04", "03:00");
      expect(utcDate.toISOString()).toBe("2026-11-03T21:30:00.000Z");
    });

    it("extracts correct IST parts from UTC Date", () => {
      const utcDate = new Date("2026-11-04T04:30:00.000Z");
      const parts = utcToIstParts(utcDate);
      expect(parts.year).toBe(2026);
      expect(parts.month).toBe(11);
      expect(parts.day).toBe(4);
      expect(parts.hours).toBe(10);
      expect(parts.minutes).toBe(0);
      expect(parts.timeStr).toBe("10:00");
    });

    it("formats dates and times into user-friendly IST labels", () => {
      expect(formatIstTime("09:05")).toBe("09:05 AM");
      expect(formatIstTime("14:30")).toBe("02:30 PM");
      expect(formatIstTime("00:00")).toBe("12:00 AM");
      expect(formatIstTime("12:00")).toBe("12:00 PM");
      expect(formatIstDate("2026-11-04")).toContain("Nov");
    });
  });

  describe("Reminder Deduplication Key", () => {
    it("generates deterministic unique dedupe keys combining appointmentId, messageType, and slot timestamp", () => {
      const key = getAppointmentMessageDedupeKey(
        "apt-101",
        "reminder_same_day",
        "2026-11-04",
        "10:30"
      );
      expect(key).toBe("apt-101_reminder_same_day_2026-11-04T10:30:00");
    });

    it("produces fresh dedupe keys for rescheduled slots", () => {
      const key1 = getAppointmentMessageDedupeKey(
        "apt-101",
        "reminder_same_day",
        "2026-11-04",
        "10:30"
      );
      const key2 = getAppointmentMessageDedupeKey(
        "apt-101",
        "reminder_same_day",
        "2026-11-05",
        "14:00"
      );
      expect(key1).not.toBe(key2);
    });
  });

  describe("Reminder Schedule Calculation Rules", () => {
    const appointmentId = "apt-999";

    it("Rule a: Slot before 10:00 AM gets 07:00 AM same-day reminder", () => {
      // Slot at 09:15 AM IST on Nov 10, booked 3 days earlier
      const approvalTime = istToUtc("2026-11-07", "11:00");
      const plans = calculateReminderSchedule({
        appointmentId,
        appointmentDate: "2026-11-10",
        startTime: "09:15",
        approvalTimeUtc: approvalTime,
      });

      const sameDay = plans.find((p) => p.messageType === "reminder_same_day");
      expect(sameDay).toBeDefined();

      const istParts = utcToIstParts(sameDay!.scheduledForUtc);
      expect(istParts.dateStr).toBe("2026-11-10");
      expect(istParts.timeStr).toBe("07:00");
    });

    it("Rule a: Slot between 10:00 AM and 13:00 gets 07:30 AM same-day reminder", () => {
      const approvalTime = istToUtc("2026-11-07", "11:00");
      const plans = calculateReminderSchedule({
        appointmentId,
        appointmentDate: "2026-11-10",
        startTime: "11:30",
        approvalTimeUtc: approvalTime,
      });

      const sameDay = plans.find((p) => p.messageType === "reminder_same_day");
      expect(sameDay).toBeDefined();

      const istParts = utcToIstParts(sameDay!.scheduledForUtc);
      expect(istParts.dateStr).toBe("2026-11-10");
      expect(istParts.timeStr).toBe("07:30");
    });

    it("Rule a: Slot later than 13:00 gets slot time minus 2.5 hours", () => {
      // 15:30 (3:30 PM) minus 2.5 hours = 13:00 (1:00 PM)
      const approvalTime = istToUtc("2026-11-07", "11:00");
      const plans = calculateReminderSchedule({
        appointmentId,
        appointmentDate: "2026-11-10",
        startTime: "15:30",
        approvalTimeUtc: approvalTime,
      });

      const sameDay = plans.find((p) => p.messageType === "reminder_same_day");
      expect(sameDay).toBeDefined();

      const istParts = utcToIstParts(sameDay!.scheduledForUtc);
      expect(istParts.dateStr).toBe("2026-11-10");
      expect(istParts.timeStr).toBe("13:00");
    });

    it("Rule a: Slot later than 13:00 never triggers earlier than 07:00 AM", () => {
      // 13:15 minus 2.5 hours = 10:45 AM
      const approvalTime = istToUtc("2026-11-07", "11:00");
      const plans = calculateReminderSchedule({
        appointmentId,
        appointmentDate: "2026-11-10",
        startTime: "13:15",
        approvalTimeUtc: approvalTime,
      });

      const sameDay = plans.find((p) => p.messageType === "reminder_same_day");
      expect(sameDay).toBeDefined();

      const istParts = utcToIstParts(sameDay!.scheduledForUtc);
      expect(istParts.hours).toBeGreaterThanOrEqual(7);
    });

    it("Rule b: Evening-before reminder at 18:00 IST the day before appointment", () => {
      const approvalTime = istToUtc("2026-11-07", "10:00");
      const plans = calculateReminderSchedule({
        appointmentId,
        appointmentDate: "2026-11-10",
        startTime: "11:00",
        approvalTimeUtc: approvalTime,
      });

      const eveningBefore = plans.find((p) => p.messageType === "reminder_evening_before");
      expect(eveningBefore).toBeDefined();

      const istParts = utcToIstParts(eveningBefore!.scheduledForUtc);
      expect(istParts.dateStr).toBe("2026-11-09");
      expect(istParts.timeStr).toBe("18:00");
    });

    it("Rule c (SPEC EXAMPLE): Tuesday 8 PM booking for Wednesday 9 AM gets ONLY 07:00 Wednesday reminder and NO evening-before reminder", () => {
      // Tuesday 2026-11-03 at 20:00 (8 PM) IST
      const approvalTime = istToUtc("2026-11-03", "20:00");
      // Wednesday 2026-11-04 at 09:00 AM IST
      const plans = calculateReminderSchedule({
        appointmentId,
        appointmentDate: "2026-11-04",
        startTime: "09:00",
        approvalTimeUtc: approvalTime,
      });

      // Evening-before was scheduled for Tuesday 18:00, which is in the past at 20:00
      const eveningBefore = plans.find((p) => p.messageType === "reminder_evening_before");
      expect(eveningBefore).toBeUndefined();

      // Same-day reminder at 07:00 Wednesday is in the future
      const sameDay = plans.find((p) => p.messageType === "reminder_same_day");
      expect(sameDay).toBeDefined();
      const istParts = utcToIstParts(sameDay!.scheduledForUtc);
      expect(istParts.dateStr).toBe("2026-11-04");
      expect(istParts.timeStr).toBe("07:00");
    });

    it("Rule d: Quiet hours (21:00 to 07:00 IST) are respected", () => {
      // Reminders are never scheduled between 21:00 and 07:00
      const approvalTime = istToUtc("2026-11-01", "10:00");
      const plans = calculateReminderSchedule({
        appointmentId,
        appointmentDate: "2026-11-05",
        startTime: "16:00",
        approvalTimeUtc: approvalTime,
      });

      for (const plan of plans) {
        const parts = utcToIstParts(plan.scheduledForUtc);
        const hour = parts.hours;
        // Hour must NOT be between 21:00 and 06:59
        expect(hour >= 7 && hour < 21).toBe(true);
      }
    });
  });

  describe("Template Variables & Clinical Privacy Protection", () => {
    const mockAppt: AppointmentContext = {
      id: "apt-123",
      patientId: "pat-123",
      patientName: "Aarav Sharma",
      guardianName: "Rajesh Sharma",
      guardianPhone: "+919820011001",
      doctorId: "doc-1",
      doctorName: "Dr. Ananya Roy",
      appointmentDate: "2026-11-04",
      startTime: "10:30",
      endTime: "11:00",
    };

    it("strictly populates only allowed variables", () => {
      const vars = buildAllowedTemplateVariables(
        mockAppt,
        "Plot 42, Sector 5, Medical Enclave, New Delhi - 110001"
      );

      expect(vars).toEqual({
        guardian_name: "Rajesh Sharma",
        child_first_name: "Aarav",
        doctor_name: "Dr. Ananya Roy",
        date: expect.any(String),
        time_slot: "10:30 AM - 11:00 AM",
        hospital_address: "Plot 42, Sector 5, Medical Enclave, New Delhi - 110001",
      });

      // Must never have diagnosis, symptoms, or medications
      expect(vars).not.toHaveProperty("diagnosis");
      expect(vars).not.toHaveProperty("symptoms");
      expect(vars).not.toHaveProperty("prescription");
    });

    it("all 4 official templates render cleanly with allowed variables", () => {
      const vars = buildAllowedTemplateVariables(
        mockAppt,
        "Plot 42, Sector 5, Medical Enclave, New Delhi - 110001"
      );

      const templateNames = [
        "appointment_confirmation",
        "appointment_reminder",
        "appointment_cancelled",
        "appointment_rescheduled",
      ];

      for (const tName of templateNames) {
        const tpl = APPROVED_TEMPLATES.find((t) => t.name === tName);
        expect(tpl).toBeDefined();

        const { sanitizedText, strippedClinicalData } = prepareAndSanitizeWhatsAppMessage(
          tpl!.bodyText,
          vars
        );

        expect(strippedClinicalData).toBe(false);
        expect(sanitizedText).toContain("Rajesh Sharma");
        expect(sanitizedText).toContain("Aarav");
        expect(sanitizedText).toContain("Dr. Ananya Roy");
        expect(sanitizedText).not.toContain("{{");
        expect(sanitizedText).not.toContain("}}");
      }
    });

    it("sanitizes any inadvertent clinical diagnosis string passed as parameter", () => {
      const tpl =
        "Dear {{guardian_name}}, appointment for {{child_first_name}} regarding {{diagnosis}}.";
      const vars = {
        guardian_name: "Rajesh Sharma",
        child_first_name: "Aarav",
        diagnosis: "Acute Bronchitis and Severe Asthma Attack",
      };

      const { sanitizedText, strippedClinicalData } = prepareAndSanitizeWhatsAppMessage(
        tpl,
        vars
      );

      expect(strippedClinicalData).toBe(true);
      expect(sanitizedText).not.toContain("Bronchitis");
      expect(sanitizedText).not.toContain("Asthma Attack");
    });
  });
});

