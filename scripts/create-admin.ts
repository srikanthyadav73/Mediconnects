/**
 * Script to create the first CareBridge Admin user in Supabase.
 * Usage: npx tsx scripts/create-admin.ts <email> <password> <fullName>
 * Example: npx tsx scripts/create-admin.ts admin@carebridge.in Admin@12345 "Dr. Vikram Seth (Medical Director)"
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || supabaseUrl === "YOUR_PROJECT_URL") {
  console.error("❌ Error: Valid NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env or .env.local");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const email = process.argv[2] || "admin@carebridge.in";
  const password = process.argv[3] || "Admin@CareBridge2026!";
  const fullName = process.argv[4] || "Administrator";

  console.log(`\n🏥 Creating CareBridge Admin User...`);
  console.log(`Email: ${email}`);
  console.log(`Name:  ${fullName}\n`);

  // 1. Create or get Auth User
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  let userId: string | undefined = authData?.user?.id;

  if (authError) {
    if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
      console.log(`⚠️ User with email ${email} already exists. Fetching existing user...`);
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users.find((u) => u.email === email);
      if (existing) {
        userId = existing.id;
      } else {
        throw authError;
      }
    } else {
      console.error(`❌ Failed to create Auth user:`, authError.message);
      process.exit(1);
    }
  }

  if (!userId) {
    console.error("❌ Could not determine user ID");
    process.exit(1);
  }

  console.log(`✅ Auth user verified: ${userId}`);

  // 2. Upsert Profile
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    email: email,
    is_active: true,
  });

  if (profileError) {
    console.error(`❌ Failed to create profile:`, profileError.message);
  } else {
    console.log(`✅ Profile created in public.profiles`);
  }

  // 3. Assign 'admin' role in user_roles
  const { error: roleError } = await supabase.from("user_roles").upsert(
    {
      user_id: userId,
      role: "admin",
    },
    { onConflict: "user_id, role" }
  );

  if (roleError) {
    console.error(`❌ Failed to assign admin role:`, roleError.message);
  } else {
    console.log(`✅ Role 'admin' assigned in public.user_roles`);
  }

  console.log(`\n🎉 Success! You can now log into CareBridge with:`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}\n`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

