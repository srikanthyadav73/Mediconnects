export interface ExistingAppointmentSlot {
  id: string;
  doctorId: string;
  doctorName?: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss or HH:mm
  endTime: string; // HH:mm:ss or HH:mm
  status: "booked" | "confirmed" | "completed" | "cancelled" | "no_show";
}

export interface SlotConflictCheckInput {
  appointmentIdToExclude?: string;
  doctorId: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

function timeToMinutes(t: string): number {
  const parts = t.split(":");
  const hours = parseInt(parts[0] || "0", 10);
  const minutes = parseInt(parts[1] || "0", 10);
  return hours * 60 + minutes;
}

/**
 * Checks if a slot double-books the same doctor on the same date.
 * Active statuses that cause conflict: 'booked', 'confirmed'.
 * Cancelled or no-show slots do NOT cause conflict.
 */
export function checkSlotConflict(
  input: SlotConflictCheckInput,
  existingSlots: ExistingAppointmentSlot[]
): { hasConflict: boolean; conflictingAppointment?: ExistingAppointmentSlot } {
  const newStart = timeToMinutes(input.startTime);
  const newEnd = timeToMinutes(input.endTime);

  const conflict = existingSlots.find((slot) => {
    // Skip checking itself when rescheduling
    if (input.appointmentIdToExclude && slot.id === input.appointmentIdToExclude) {
      return false;
    }

    // Only active bookings block the slot
    if (slot.status !== "booked" && slot.status !== "confirmed") {
      return false;
    }

    // Must be same doctor and same date
    if (slot.doctorId !== input.doctorId || slot.appointmentDate !== input.appointmentDate) {
      return false;
    }

    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);

    // Overlap condition: startA < endB && endA > startB
    const overlaps = newStart < slotEnd && newEnd > slotStart;
    return overlaps;
  });

  return {
    hasConflict: Boolean(conflict),
    conflictingAppointment: conflict,
  };
}
