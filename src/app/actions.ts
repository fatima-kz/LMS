"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnvError } from "@/lib/env";
import { z } from "zod";

const schema = z.object({
  schoolName: z.string().min(2, "School name is required"),
  adminName: z.string().min(2, "Admin name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerSchool(prev: unknown, formData: FormData) {
  const envError = getEnvError();
  if (envError) return { error: envError };

  const parsed = schema.safeParse({
    schoolName: formData.get("schoolName"),
    adminName: formData.get("adminName"),
    email: (formData.get("email") as string)?.trim().toLowerCase(),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { schoolName, adminName, email, password } = parsed.data;

  try {
    const admin = createAdminClient();

    // Check if email already exists in auth.
    const { data: existing, error: listErr } = await admin.auth.admin.listUsers();
    if (!listErr && existing?.users?.some((u) => u.email === email)) {
      return { error: "An account with this email already exists." };
    }

    // 1. Create the auth user (confirmed, so they can log in immediately).
    const { data: created, error: userErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: adminName },
    });
    if (userErr || !created.user) {
      return { error: userErr?.message ?? "Failed to create account" };
    }
    const userId = created.user.id;

    // 2. Create the school.
    const { data: school, error: schoolErr } = await admin
      .from("schools")
      .insert({
        name: schoolName,
        slug: schoolName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      })
      .select()
      .single();
    if (schoolErr || !school) {
      await admin.auth.admin.deleteUser(userId);
      return {
        error:
          schoolErr?.message ??
          "Failed to create school. Have you run supabase/schema.sql in your Supabase project?",
      };
    }

    // 3. Create the admin profile.
    const { error: profileErr } = await admin.from("profiles").insert({
      id: userId,
      school_id: school.id,
      role: "admin",
      full_name: adminName,
      email,
    });
    if (profileErr) {
      await admin.from("schools").delete().eq("id", school.id);
      await admin.auth.admin.deleteUser(userId);
      return { error: profileErr.message };
    }

    // 4. Seed the first academic year (current).
    const year = new Date().getFullYear();
    await admin.from("academic_years").insert({
      school_id: school.id,
      name: `${year}-${year + 1}`,
      start_date: `${year}-09-01`,
      end_date: `${year + 1}-06-30`,
      is_current: true,
    });
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Unexpected error during registration.",
    };
  }

  revalidatePath("/login");
  redirect("/login?registered=1");
}

export async function logout() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/login");
}
