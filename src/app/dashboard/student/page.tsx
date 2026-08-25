import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function StudentOverview() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id, name")
    .eq("is_current", true)
    .single();

  const { data: mine } = await supabase
    .from("enrollments")
    .select("section_id, section:sections(name, class:classes(name))")
    .eq("student_id", profile!.id)
    .eq("academic_year_id", year?.id ?? "")
    .eq("status", "active")
    .single();

  const sec = mine?.section as unknown as { name: string; class: { name: string } } | null;

  // Diary
  const { count: pendingDiary } = await supabase
    .from("daily_diary_entries")
    .select("*", { count: "exact", head: true })
    .eq("student_id", profile!.id)
    .eq("academic_year_id", year?.id ?? "")
    .eq("status", "pending");

  // Pending assignments from their section
  let pendingAssignments: { id: string; title: string; due_date: string | null }[] = [];
  if (mine?.section_id && year?.id) {
    const { data: tas } = await supabase
      .from("teaching_assignments")
      .select("id")
      .eq("section_id", mine.section_id)
      .eq("academic_year_id", year.id);
    const taIds = (tas ?? []).map((t) => t.id);
    const { data: assignments } = await supabase
      .from("course_content")
      .select("id, title, due_date")
      .in("teaching_assignment_id", taIds.length ? taIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("is_assignment", true)
      .order("due_date", { ascending: true })
      .limit(5);
    pendingAssignments = (assignments ?? []) as typeof pendingAssignments;
  }

  // Recent announcements
  const { data: anns } = await supabase
    .from("announcements")
    .select("id, title, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Attendance summary
  const { data: att } = await supabase
    .from("attendance_entries")
    .select("status, session:attendance_sessions(teaching_assignment:teaching_assignments(academic_year_id))")
    .eq("student_id", profile!.id);
  const attCurrent = (att ?? []).filter(
    (e) =>
      (e.session as unknown as { teaching_assignment?: { academic_year_id?: string } } | null)
        ?.teaching_assignment?.academic_year_id === year?.id,
  );
  const present = attCurrent.filter((e) => e.status === "present").length;

  return (
    <div>
      <PageHeader
        title={`Welcome, ${profile!.full_name.split(" ")[0]}`}
        description={
          sec ? `${sec.class?.name} — ${sec?.name} · ${year?.name ?? ""}` : "Not enrolled yet"
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending diary" value={pendingDiary ?? 0} />
        <StatCard label="Assignments" value={pendingAssignments.length} />
        <StatCard label="Days present" value={present} hint="this session" />
        <StatCard label="Announcements" value={anns?.length ?? 0} hint="recent" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Pending assignments</CardTitle>
            <Link href="/dashboard/student/courses" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {!pendingAssignments.length ? (
              <EmptyState title="Nothing pending" />
            ) : (
              <div className="space-y-2">
                {pendingAssignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
                    <p className="font-medium">{a.title}</p>
                    <Badge variant="warning">due {formatDate(a.due_date)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent announcements</CardTitle>
            <Link href="/dashboard/student/announcements" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {!anns?.length ? (
              <EmptyState title="No announcements" />
            ) : (
              <div className="space-y-2">
                {anns.map((a) => (
                  <div key={a.id} className="rounded-md border p-3">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
