import { describe, it, expect } from "vitest";
import {
  checkSlotConflict,
  type ExistingAppointmentSlot,
} from "@/lib/appointment-conflict";

const sampleAppointments: ExistingAppointmentSlot[] = [
  {
    id: "apt-1",
    doctorId: "doc-1",
    doctorName: "Dr. Ananya Roy",
    appointmentDate: "2026-11-05",
    startTime: "10:00",
    endTime: "10:30",
    status: "confirmed",
  },
  {
    id: "apt-2",
    doctorId: "doc-1",
    doctorName: "Dr. Ananya Roy",
    appointmentDate: "2026-11-05",
    startTime: "11:00",
    endTime: "11:30",
    status: "cancelled", // Cancelled slot should NOT block
  },
  {
    id: "apt-3",
    doctorId: "doc-2",
    doctorName: "Dr. Rahul Deshpande",
    appointmentDate: "2026-11-05",
    startTime: "10:00",
    endTime: "10:30",
    status: "confirmed",
  },
];

describe("Appointment Slot Double-Booking Prevention", () => {
  it("detects exact overlap with an active confirmed slot for the same doctor", () => {
    const result = checkSlotConflict(
      {
        doctorId: "doc-1",
        appointmentDate: "2026-11-05",
        startTime: "10:00",
        endTime: "10:30",
      },
      sampleAppointments
    );

    expect(result.hasConflict).toBe(true);
    expect(result.conflictingAppointment?.id).toBe("apt-1");
  });

  it("detects partial overlap with an active slot for the same doctor", () => {
    const result = checkSlotConflict(
      {
        doctorId: "doc-1",
        appointmentDate: "2026-11-05",
        startTime: "10:15",
        endTime: "10:45",
      },
      sampleAppointments
    );

    expect(result.hasConflict).toBe(true);
  });

  it("allows booking the same slot with a DIFFERENT doctor", () => {
    const result = checkSlotConflict(
      {
        doctorId: "doc-3", // Dr. Meenakshi Sundaram
        appointmentDate: "2026-11-05",
        startTime: "10:00",
        endTime: "10:30",
      },
      sampleAppointments
    );

    expect(result.hasConflict).toBe(false);
  });

  it("allows booking a slot that was previously CANCELLED", () => {
    const result = checkSlotConflict(
      {
        doctorId: "doc-1",
        appointmentDate: "2026-11-05",
        startTime: "11:00",
        endTime: "11:30",
      },
      sampleAppointments
    );

    expect(result.hasConflict).toBe(false);
  });

  it("allows rescheduling an appointment to its own slot", () => {
    const result = checkSlotConflict(
      {
        appointmentIdToExclude: "apt-1",
        doctorId: "doc-1",
        appointmentDate: "2026-11-05",
        startTime: "10:00",
        endTime: "10:30",
      },
      sampleAppointments
    );

    expect(result.hasConflict).toBe(false);
  });
});

