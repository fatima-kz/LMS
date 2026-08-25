"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/data";

async function requireTeacher() {
  return requireRole("teacher");
}

// ---------- Course content ----------
export async function createContent(formData: FormData) {
  const profile = await requireTeacher();
  const supabase = await createClient();
  const teaching_assignment_id = String(formData.get("teaching_assignment_id"));
  const title = String(formData.get("title"));
  const description = String(formData.get("description") || "");
  const body = String(formData.get("body") || "");
  const content_date = String(formData.get("content_date") || "");
  const is_assignment = formData.get("is_assignment") === "on";
  const due_date = String(formData.get("due_date") || "");
  if (!teaching_assignment_id || !title) return { error: "Class and title required" };

  const { error } = await supabase.from("course_content").insert({
    teaching_assignment_id,
    teacher_id: profile.id,
    title,
    description: description || null,
    body: body || null,
    content_date: content_date || new Date().toISOString().slice(0, 10),
    is_assignment,
    due_date: is_assignment && due_date ? due_date : null,
    school_id: profile.school_id,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/teacher/content");
  return { ok: true };
}

export async function deleteContent(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("course_content").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/teacher/content");
  return { ok: true };
}

// ---------- Attendance ----------
export async function saveAttendance(formData: FormData) {
  const profile = await requireTeacher();
  const supabase = await createClient();
  const teaching_assignment_id = String(formData.get("teaching_assignment_id"));
  const session_date = String(formData.get("session_date"));
  if (!teaching_assignment_id || !session_date) return { error: "Missing data" };

  // Upsert session (unique ta+date).
  const { data: session, error: sErr } = await supabase
    .from("attendance_sessions")
    .upsert(
      { teaching_assignment_id, teacher_id: profile.id, session_date },
      { onConflict: "teaching_assignment_id,session_date" },
    )
    .select()
    .single();
  if (sErr || !session) return { error: sErr?.message ?? "Session error" };

  // Collect student statuses from formData (status_<studentId>).
  const entries: { student_id: string; status: string; note: string | null }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("status_") && typeof value === "string") {
      const student_id = key.slice("status_".length);
      if (student_id) entries.push({ student_id, status: value, note: null });
    }
  }
  if (!entries.length) return { error: "No students found for this section" };

  // Delete existing entries for this session, then insert fresh.
  await supabase.from("attendance_entries").delete().eq("attendance_session_id", session.id);
  const { error: eErr } = await supabase.from("attendance_entries").insert(
    entries.map((e) => ({
      attendance_session_id: session.id,
      student_id: e.student_id,
      status: e.status,
      note: e.note,
      school_id: profile.school_id,
    })),
  );
  if (eErr) return { error: eErr.message };
  revalidatePath("/dashboard/teacher/attendance");
  return { ok: true };
}

// ---------- Announcements (teacher) ----------
export async function createAnnouncementTeacher(formData: FormData) {
  const profile = await requireTeacher();
  const supabase = await createClient();
  const title = String(formData.get("title"));
  const body = String(formData.get("body") || "");
  const audience = String(formData.get("audience")) as "section" | "my_sections";
  const section_id = String(formData.get("section_id") || "");
  if (!title) return { error: "Title required" };
  if (audience === "section" && !section_id) return { error: "Section required" };

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
  revalidatePath("/dashboard/teacher/announcements");
  revalidatePath("/dashboard/student/announcements");
  return { ok: true };
}
