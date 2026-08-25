import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { PageHeader, EmptyState, StatCard } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function StudentAttendancePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id, name")
    .eq("is_current", true)
    .single();

  const { data: entries } = await supabase
    .from("attendance_entries")
    .select(
      "id, status, note, attendance_session_id, session:attendance_sessions(session_date, teaching_assignment_id, teaching_assignment:teaching_assignments(academic_year_id, subject:subjects(name)))",
    )
    .eq("student_id", profile!.id)
    .order("created_at", { ascending: false });

  type Row = {
    id: string;
    status: string;
    note: string | null;
    session: {
      session_date: string;
      teaching_assignment: { academic_year_id: string; subject: { name: string } | null } | null;
    } | null;
  };

  const rows = (entries ?? []) as unknown as Row[];
  const current = rows.filter(
    (e) => e.session?.teaching_assignment?.academic_year_id === year?.id,
  );

  const counts: Record<string, number> = {};
  for (const e of current) counts[e.status] = (counts[e.status] ?? 0) + 1;

  return (
    <div>
      <PageHeader title="My Attendance" description={year?.name ?? ""} />

      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        <StatCard label="Present" value={counts["present"] ?? 0} />
        <StatCard label="Absent" value={counts["absent"] ?? 0} />
        <StatCard label="Late" value={counts["late"] ?? 0} />
        <StatCard label="Excused" value={counts["excused"] ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Records ({current.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {!current.length ? (
            <EmptyState title="No attendance records yet" />
          ) : (
            <Table>
              <THead>
                <TRow>
                  <TH>Date</TH>
                  <TH>Subject</TH>
                  <TH>Status</TH>
                  <TH>Note</TH>
                </TRow>
              </THead>
              <TBody>
                {current.map((e) => (
                  <TRow key={e.id}>
                    <TD>{formatDate(e.session?.session_date ?? null)}</TD>
                    <TD>{e.session?.teaching_assignment?.subject?.name ?? "—"}</TD>
                    <TD>
                      <Badge
                        variant={
                          e.status === "present"
                            ? "success"
                            : e.status === "absent"
                              ? "destructive"
                              : e.status === "late"
                                ? "warning"
                                : "secondary"
                        }
                      >
                        {e.status}
                      </Badge>
                    </TD>
                    <TD className="text-muted-foreground">{e.note ?? "—"}</TD>
                  </TRow>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
