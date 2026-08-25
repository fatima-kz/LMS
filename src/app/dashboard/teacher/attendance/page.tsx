import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { saveAttendance } from "../actions";
import { AttendanceForm } from "./attendance-form";

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ ta?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .single();

  const { data: assignments } = await supabase
    .from("teaching_assignments")
    .select("id, subject:subjects(name), section:sections(id, name, class:classes(name))")
    .eq("teacher_id", profile!.id)
    .eq("academic_year_id", year?.id ?? "")
    .order("created_at");

  const taId = sp.ta ?? (assignments?.[0]?.id as string | undefined);
  const date = sp.date ?? new Date().toISOString().slice(0, 10);

  // Resolve the selected assignment's section.
  const selected = (assignments ?? []).find((a) => a.id === taId);
  const sectionId = selected?.section
    ? (selected.section as unknown as { id: string }).id
    : null;

  let students: { id: string; name: string; roll: string | null }[] = [];
  if (sectionId && year?.id) {
    const { data: roster } = await supabase
      .from("enrollments")
      .select("student_id, roll_number, student:profiles(full_name)")
      .eq("section_id", sectionId)
      .eq("academic_year_id", year.id)
      .eq("status", "active")
      .order("roll_number");
    students = (roster ?? []).map((r) => {
      const stu = r.student as unknown as { full_name: string } | null;
      return { id: r.student_id, name: stu?.full_name ?? "—", roll: r.roll_number };
    });
  }

  return (
    <div>
      <PageHeader title="Attendance" description="Take attendance for one of your classes." />

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <form className="space-y-1">
          <Label>Class</Label>
          <Select name="ta" defaultValue={taId}>
            <option value="">Select…</option>
            {(assignments ?? []).map((a) => {
              const sub = a.subject as unknown as { name: string } | null;
              const sec = a.section as unknown as { name: string; class: { name: string } } | null;
              return (
                <option key={a.id} value={a.id}>
                  {sec?.class?.name} — {sec?.name} · {sub?.name}
                </option>
              );
            })}
          </Select>
        </form>
        <form className="space-y-1">
          <Label>Date</Label>
          <input
            name="date"
            type="date"
            defaultValue={date}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
          <button type="submit" className="rounded-md border px-3 py-1 text-xs hover:bg-accent">
            Load roster
          </button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roster for {date}</CardTitle>
        </CardHeader>
        <CardContent>
          {!taId || !students.length ? (
            <EmptyState
              title={taId ? "No students in this section" : "Select a class"}
              description={taId ? "Enroll students first (admin)." : "Choose a class and date above."}
            />
          ) : (
            <AttendanceForm action={saveAttendance} taId={taId} date={date} students={students} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
