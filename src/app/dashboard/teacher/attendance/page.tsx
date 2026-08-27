import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  if (!profile) throw new Error("Unauthorized");

  const { data: year } = await supabase
    .from("academic_years")
    .select("id, name")
    .eq("is_current", true)
    .maybeSingle();

  const { data: assignments } = await supabase
    .from("teaching_assignments")
    .select("id, subject:subjects(name), section:sections(id, name, class:classes(name))")
    .eq("teacher_id", profile.id)
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

  // Past attendance: fetch sessions, then entries separately (avoids fragile nested joins)
  let pastSessions: {
    id: string;
    session_date: string;
    entries: { status: string }[];
  }[] = [];

  if (taId) {
    const { data: sessions } = await supabase
      .from("attendance_sessions")
      .select("id, session_date")
      .eq("teaching_assignment_id", taId)
      .order("session_date", { ascending: false });

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map((s) => s.id);
      const { data: allEntries } = await supabase
        .from("attendance_entries")
        .select("id, status, attendance_session_id")
        .in("attendance_session_id", sessionIds);

      // Group entries by session
      const entriesBySession: Record<string, { status: string }[]> = {};
      for (const e of allEntries ?? []) {
        (entriesBySession[e.attendance_session_id] ??= []).push({ status: e.status });
      }

      pastSessions = sessions.map((s) => ({
        id: s.id,
        session_date: s.session_date,
        entries: entriesBySession[s.id] ?? [],
      }));
    }
  }

  // Check if attendance was already taken for this date
  const alreadyTaken = pastSessions.some((s) => s.session_date === date);

  return (
    <div>
      <PageHeader title="Attendance" description="Take or review attendance for your classes." />

      {/* Single combined form: class + date together so neither is lost on submit */}
      <form className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
        <div className="space-y-1">
          <Label>Class</Label>
          <Select name="ta" defaultValue={taId} className="w-64">
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
        </div>
        <div className="space-y-1">
          <Label>Date</Label>
          <input
            name="date"
            type="date"
            defaultValue={date}
            className="flex h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <Button type="submit" size="sm">Load</Button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Take attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Take attendance — {formatDate(date)}</CardTitle>
          </CardHeader>
          <CardContent>
            {!taId ? (
              <EmptyState
                title="Select a class"
                description="Choose a class and date above, then click Load."
              />
            ) : !students.length ? (
              <EmptyState
                title="No students in this section"
                description="Enroll students first (admin)."
              />
            ) : (
              <AttendanceForm action={saveAttendance} taId={taId} date={date} students={students} />
            )}
          </CardContent>
        </Card>

        {/* Past sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Past sessions ({pastSessions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {!taId ? (
              <EmptyState title="Select a class" description="Past attendance appears once you choose a class." />
            ) : pastSessions.length === 0 ? (
              <EmptyState title="No attendance taken yet" description="Sessions you record will show up here." />
            ) : (
              <div className="space-y-3">
                {pastSessions.map((s) => {
                  const counts: Record<string, number> = {};
                  for (const e of s.entries) counts[e.status] = (counts[e.status] ?? 0) + 1;
                  return (
                    <div key={s.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{formatDate(s.session_date)}</p>
                        <Badge variant="secondary">{s.entries.length} students</Badge>
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
