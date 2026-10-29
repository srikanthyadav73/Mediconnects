"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { setDemoSession, clearStaffSession, DEMO_USERS } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import type { UserRole } from "@/types/database";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid hospital email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function loginStaffAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Invalid credentials provided.",
    };
  }

  // If Supabase is connected with real credentials
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        // Fetch role
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();

        const role = (roleRow?.role as UserRole) || "receptionist";
        await setDemoSession({
          id: data.user.id,
          email: data.user.email || "",
          fullName: data.user.user_metadata?.full_name || "Hospital Staff",
          role,
          isMock: false,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      return { error: message };
    }
  } else {
    // Demo / Mock Mode login
    const matchingDemo = Object.values(DEMO_USERS).find(
      (u) => u.email.toLowerCase() === parsed.data.email.toLowerCase()
    );

    if (matchingDemo) {
      await setDemoSession(matchingDemo);
    } else {
      // Default fallback staff session for custom entered emails in test mode
      await setDemoSession({
        id: "00000000-0000-0000-0000-000000000099",
        email: parsed.data.email,
        fullName: parsed.data.email.split("@")[0] || "Hospital Staff",
        role: "admin",
        isMock: true,
      });
    }
  }

  redirect("/dashboard");
}

export async function loginDemoRoleAction(role: "admin" | "doctor" | "receptionist") {
  const user = DEMO_USERS[role];
  if (user) {
    await setDemoSession(user);
    redirect("/dashboard");
  }
}

export async function logoutStaffAction() {
  await clearStaffSession();
  redirect("/login");
}

