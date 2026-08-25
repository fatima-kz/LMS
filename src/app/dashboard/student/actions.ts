"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/data";

async function requireStudent() {
  return requireRole("student");
}

export async function createDiary(formData: FormData) {
  const profile = await requireStudent();
  const supabase = await createClient();
  const title = String(formData.get("title"));
  const description = String(formData.get("description") || "");
  const entry_date = String(formData.get("entry_date") || "");
  const due_date = String(formData.get("due_date") || "");
  const subject_id = String(formData.get("subject_id") || "");
  const status = (String(formData.get("status") || "pending")) as "pending" | "completed";
  if (!title) return { error: "Title required" };

  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .single();
  if (!year) return { error: "No current academic year" };

  const { error } = await supabase.from("daily_diary_entries").insert({
    student_id: profile.id,
    academic_year_id: year.id,
    title,
    description: description || null,
    entry_date: entry_date || new Date().toISOString().slice(0, 10),
    due_date: due_date || null,
    subject_id: subject_id || null,
    status,
    school_id: profile.school_id,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/student/diary");
  return { ok: true };
}

export async function updateDiaryStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as "pending" | "completed";
  const supabase = await createClient();
  const { error } = await supabase
    .from("daily_diary_entries")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/student/diary");
  return { ok: true };
}

export async function deleteDiary(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("daily_diary_entries")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/student/diary");
  return { ok: true };
}
