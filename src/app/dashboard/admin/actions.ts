"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/data";
import type { Role } from "@/lib/types";
import { z } from "zod";

async function adminSchoolId() {
  const profile = await requireRole("admin");
  return profile.school_id;
}

// ---------- Users (students / teachers) ----------
const userSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["teacher", "student"]),
  phone: z.string().optional(),
});

export async function createUser(formData: FormData) {
  const parsed = userSchema.safeParse({
    full_name: formData.get("full_name"),
    email: (formData.get("email") as string)?.trim().toLowerCase(),
    password: formData.get("password"),
    role: formData.get("role"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { full_name, email, password, role, phone } = parsed.data;
  const school_id = await adminSchoolId();

  const admin = createAdminClient();
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  });
  if (userErr || !created.user) return { error: userErr?.message ?? "Failed" };

  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    school_id,
    role: role as Role,
    full_name,
    email,
    phone: phone || null,
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: profileErr.message };
  }
  revalidatePath("/dashboard/admin");
  return { ok: true };
}

export async function toggleUserActive(formData: FormData) {
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: !active })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { ok: true };
}

export async function deleteUser(formData: FormData) {
  const id = String(formData.get("id"));
  const admin = createAdminClient();
  // Deleting the auth user cascades to profiles (FK on delete cascade).
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin");
  return { ok: true };
}

// ---------- Classes ----------
export async function createClass(formData: FormData) {
  const name = String(formData.get("name"));
  const level = Number(formData.get("level"));
  if (!name || !level) return { error: "Name and level are required" };
  const school_id = await adminSchoolId();
  const supabase = await createClient();
  const { error } = await supabase.from("classes").insert({ name, level, school_id });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/classes");
  return { ok: true };
}

export async function deleteClass(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/classes");
  return { ok: true };
}

// ---------- Sections ----------
export async function createSection(formData: FormData) {
  const name = String(formData.get("name"));
  const class_id = String(formData.get("class_id"));
  if (!name || !class_id) return { error: "Name and class are required" };
  const school_id = await adminSchoolId();
  const supabase = await createClient();
  const { error } = await supabase.from("sections").insert({ name, class_id, school_id });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/classes");
  return { ok: true };
}

export async function deleteSection(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("sections").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/classes");
  return { ok: true };
}

// ---------- Subjects ----------
export async function createSubject(formData: FormData) {
  const name = String(formData.get("name"));
  const code = String(formData.get("code") || "");
  const class_id = String(formData.get("class_id"));
  if (!name) return { error: "Name is required" };
  if (!class_id) return { error: "Class is required" };
  const school_id = await adminSchoolId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("subjects")
    .insert({ name, code: code || null, school_id, class_id });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/subjects");
  return { ok: true };
}

export async function deleteSubject(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/subjects");
  return { ok: true };
}

// ---------- Academic Years ----------
export async function createYear(formData: FormData) {
  const name = String(formData.get("name"));
  const start_date = String(formData.get("start_date") || "");
  const end_date = String(formData.get("end_date") || "");
  const makeCurrent = formData.get("is_current") === "on";
  if (!name) return { error: "Name is required" };
  const school_id = await adminSchoolId();
  const supabase = await createClient();
  if (makeCurrent) {
    await supabase
      .from("academic_years")
      .update({ is_current: false })
      .eq("is_current", true);
  }
  const { error } = await supabase.from("academic_years").insert({
    name,
    start_date: start_date || null,
    end_date: end_date || null,
    is_current: makeCurrent,
    school_id,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/years");
  return { ok: true };
}

// ---------- Enrollments ----------
export async function enrollStudent(formData: FormData) {
  const student_id = String(formData.get("student_id"));
  const section_id = String(formData.get("section_id"));
  const academic_year_id = String(formData.get("academic_year_id"));
  let roll_number = String(formData.get("roll_number") || "").trim();
  if (!student_id || !section_id || !academic_year_id)
    return { error: "Student, section and year are required" };
  const school_id = await adminSchoolId();
  const supabase = await createClient();

  // Auto-assign roll number if not provided
  if (!roll_number) {
    const { count } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("section_id", section_id)
      .eq("academic_year_id", academic_year_id);
    roll_number = String((count ?? 0) + 1);
  }

  const { error } = await supabase.from("enrollments").insert({
    student_id,
    section_id,
    academic_year_id,
    status: "active",
    school_id,
    roll_number,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/enrollments");
  return { ok: true };
}

export async function moveStudent(formData: FormData) {
  const id = String(formData.get("id"));
  const section_id = String(formData.get("section_id"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollments")
    .update({ section_id })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/enrollments");
  return { ok: true };
}

export async function deleteEnrollment(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/enrollments");
  return { ok: true };
}

// ---------- Teaching Assignments ----------
export async function assignTeacher(formData: FormData) {
  const teacher_id = String(formData.get("teacher_id"));
  const subject_id = String(formData.get("subject_id"));
  const section_id = String(formData.get("section_id"));
  const academic_year_id = String(formData.get("academic_year_id"));
  if (!teacher_id || !subject_id || !section_id || !academic_year_id)
    return { error: "All fields are required" };
  const school_id = await adminSchoolId();
  const supabase = await createClient();
  const { error } = await supabase.from("teaching_assignments").insert({
    teacher_id,
    subject_id,
    section_id,
    academic_year_id,
    school_id,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/assignments");
  return { ok: true };
}

export async function deleteAssignment(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("teaching_assignments")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/assignments");
  return { ok: true };
}

// ---------- Announcements (admin) ----------
export async function createAnnouncementAdmin(formData: FormData) {
  const title = String(formData.get("title"));
  const body = String(formData.get("body") || "");
  const audience = String(formData.get("audience")) as
    | "school"
    | "section";
  const section_id = String(formData.get("section_id") || "");
  if (!title) return { error: "Title is required" };
  if (audience === "section" && !section_id)
    return { error: "Section is required for a section announcement" };
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .single();
  if (!year) return { error: "No current academic year" };
  const { error } = await supabase.from("announcements").insert({
    author_id: profile.id,
    audience,
    section_id: audience === "section" ? section_id : null,
    academic_year_id: year.id,
    title,
    body,
    school_id: profile.school_id,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/announcements");
  revalidatePath("/dashboard/teacher/announcements");
  revalidatePath("/dashboard/student/announcements");
  return { ok: true };
}

export async function deleteAnnouncement(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

// ---------- Year rollover / promotion ----------
export async function rolloverYear(formData: FormData) {
  const new_name = String(formData.get("new_name"));
  const start_date = String(formData.get("start_date") || "");
  const end_date = String(formData.get("end_date") || "");
  if (!new_name) return { error: "New year name is required" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("promote_to_new_year", {
    p_new_name: new_name,
    p_start_date: start_date || null,
    p_end_date: end_date || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/years");
  revalidatePath("/dashboard/admin/history");
  return { ok: true, data };
}
