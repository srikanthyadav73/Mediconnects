"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  updateHospitalProfile,
  updateTariffFee,
  addTariffService,
  updateStaffRole,
  addStaffUser,
  getAppointmentMessageSettings,
  updateAppointmentMessageSettings,
  type HospitalProfile,
  type AppointmentMessageSettings,
} from "@/lib/settings-store";
import type { HospitalServiceItem } from "@/types/billing";
import type { UserRole } from "@/types/database";

export async function updateHospitalProfileAction(data: HospitalProfile) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== "admin") {
      return { success: false, error: "Unauthorized: Only administrators can update hospital profile." };
    }

    const updated = await updateHospitalProfile(data);
    revalidatePath("/settings");
    return { success: true, profile: updated };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Failed to update profile." };
  }
}

export async function updateServiceTariffAction(serviceId: string, newFee: number) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== "admin") {
      return { success: false, error: "Unauthorized: Only administrators can modify service fees." };
    }

    if (newFee < 0) {
      return { success: false, error: "Service fee cannot be negative." };
    }

    const tariffs = await updateTariffFee(serviceId, newFee);
    revalidatePath("/settings");
    revalidatePath("/billing");
    return { success: true, tariffs };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Failed to update fee." };
  }
}

export async function addServiceTariffAction(item: { name: string; category: string; defaultFee: number }) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== "admin") {
      return { success: false, error: "Unauthorized: Only administrators can add tariff services." };
    }

    const newService: HospitalServiceItem = {
      id: `srv-${Date.now()}`,
      name: item.name,
      category: item.category,
      defaultFee: item.defaultFee,
    };

    const tariffs = await addTariffService(newService);
    revalidatePath("/settings");
    revalidatePath("/billing");
    return { success: true, tariffs };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Failed to add service." };
  }
}

export async function updateStaffRoleAction(userId: string, newRole: UserRole) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== "admin") {
      return { success: false, error: "Unauthorized: Only administrators can manage staff roles." };
    }

    const staff = await updateStaffRole(userId, newRole);
    revalidatePath("/settings");
    return { success: true, staff };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Failed to update staff role." };
  }
}

export async function addStaffUserAction(data: { email: string; fullName: string; role: UserRole }) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== "admin") {
      return { success: false, error: "Unauthorized: Only administrators can register staff users." };
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      isMock: true,
    };

    const staff = await addStaffUser(newUser);
    revalidatePath("/settings");
    return { success: true, staff };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Failed to add staff user." };
  }
}

export async function getAppointmentMessageSettingsAction() {
  return await getAppointmentMessageSettings();
}

export async function updateAppointmentMessageSettingsAction(
  data: Partial<AppointmentMessageSettings>
) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== "admin") {
      return {
        success: false,
        error: "Unauthorized: Only administrators can modify appointment messaging rules.",
      };
    }

    const updated = await updateAppointmentMessageSettings(data);
    revalidatePath("/settings");
    return { success: true, settings: updated };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || "Failed to update messaging settings.",
    };
  }
}

