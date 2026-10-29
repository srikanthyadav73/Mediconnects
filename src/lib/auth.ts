import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { UserRole } from "@/types/database";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isMock: boolean;
}

export const DEMO_USERS: Record<string, SessionUser> = {
  admin: {
    id: "00000000-0000-0000-0000-000000000001",
    email: "admin@carebridge.in",
    fullName: "Dr. Ananya Roy (Chief Medical Officer)",
    role: "admin",
    isMock: true,
  },
  doctor: {
    id: "00000000-0000-0000-0000-000000000002",
    email: "dr.rahul@carebridge.in",
    fullName: "Dr. Rahul Deshpande (Senior Pediatrician)",
    role: "doctor",
    isMock: true,
  },
  receptionist: {
    id: "00000000-0000-0000-0000-000000000003",
    email: "reception@carebridge.in",
    fullName: "Kavita S. (Lead Receptionist)",
    role: "receptionist",
    isMock: true,
  },
};

const SESSION_COOKIE_NAME = "carebridge_staff_session";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const demoCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (demoCookie?.value) {
    try {
      const parsed = JSON.parse(demoCookie.value) as SessionUser;
      if (parsed && parsed.email && parsed.role) {
        return parsed;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  if (!isSupabaseConfigured) {
    // If Supabase credentials are placeholder strings and no cookie set, return default demo admin
    return DEMO_USERS.admin;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Fetch user profile and role
    const [{ data: profile }, { data: roleRow }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      supabase.from("user_roles").select("role").eq("user_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle(),
    ]);

    const role: UserRole = (roleRow?.role as UserRole) || "receptionist";

    return {
      id: user.id,
      email: user.email || "",
      fullName: profile?.full_name || user.user_metadata?.full_name || "Staff Member",
      role,
      isMock: false,
    };
  } catch (error) {
    console.error("Error retrieving Supabase user:", error);
    return null;
  }
}

export async function setDemoSession(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(user), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearStaffSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
}

