import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { PageHeader, EmptyState, StatCard } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import { saveAttendance } from "../actions";
import { AttendanceForm } from "./attendance-form";
import { formatDate } from "@/lib/utils";

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

  // Past attendance sessions for this class (current year)
  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("id, session_date, attendance_entries:attendance_entries(status)")
    .eq("teaching_assignment_id", taId ?? "")
    .order("session_date", { ascending: false });

  type SessionRow = {
    id: string;
    session_date: string;
    attendance_entries: { status: string }[];
  };
  const pastSessions = (sessions ?? []) as unknown as SessionRow[];

  return (
    <div>
      <PageHeader title="Attendance" description="Take or review attendance for your classes." />

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Take attendance — {date}</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Past sessions ({pastSessions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {!taId ? (
              <EmptyState title="Select a class" description="Past attendance appears once you choose a class." />
            ) : !pastSessions.length ? (
              <EmptyState title="No attendance taken yet" description="Sessions you record will show up here." />
            ) : (
              <div className="space-y-3">
                {pastSessions.map((s) => {
                  const counts: Record<string, number> = {};
                  for (const e of s.attendance_entries ?? [])
                    counts[e.status] = (counts[e.status] ?? 0) + 1;
                  return (
                    <div key={s.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{formatDate(s.session_date)}</p>
                        <Badge variant="secondary">{s.attendance_entries?.length ?? 0} students</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        <span className="text-emerald-600">Present {counts["present"] ?? 0}</span>
                        <span className="text-red-600">Absent {counts["absent"] ?? 0}</span>
                        <span className="text-amber-600">Late {counts["late"] ?? 0}</span>
                        <span className="text-muted-foreground">Excused {counts["excused"] ?? 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full roster table for the selected class */}
      {taId && students.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Class roster ({students.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TRow>
                  <TH>Roll</TH>
                  <TH>Student</TH>
                </TRow>
              </THead>
              <TBody>
                {students.map((s) => (
                  <TRow key={s.id}>
                    <TD>{s.roll ?? "—"}</TD>
                    <TD className="font-medium">{s.name}</TD>
                  </TRow>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
