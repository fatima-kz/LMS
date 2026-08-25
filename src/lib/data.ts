import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  AcademicYear,
  School,
  Role,
} from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data as Profile | null;
}

export async function getCurrentSchool(): Promise<School | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("schools")
    .select("*")
    .eq("id", profile.school_id)
    .single();
  return data as School | null;
}

export async function getCurrentYear(): Promise<AcademicYear | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("academic_years")
    .select("*")
    .eq("is_current", true)
    .single();
  return data as AcademicYear | null;
}

export async function requireRole(...roles: Role[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  if (!roles.includes(profile.role)) throw new Error("Forbidden");
  return profile;
}

export async function redirectToDashboard(): Promise<string> {
  const profile = await getCurrentProfile();
  if (!profile) return "/login";
  return `/dashboard/${profile.role}`;
}
