"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Verifies portal credentials against the security_portal_credentials table
 * in Supabase via an RPC function. Passwords are hashed with bcrypt.
 * The table has RLS with NO policies — only the service-role client can access.
 * No credentials are stored in code or env.
 */
export async function verifyPortalAccess(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const admin = createAdminClient();

  const { data, error } = await admin.rpc("verify_portal_credentials", {
    p_email: email,
    p_password: password,
  });

  if (error) {
    return { error: "Unable to verify credentials." };
  }

  if (!data) {
    return { error: "Invalid credentials. Access denied." };
  }

  return { ok: true };
}
