import { createClient } from "@/lib/supabase/server";
import { PageHeader, StatCard } from "@/components/ui/misc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function AdminOverview() {
  const supabase = await createClient();
  const year = await supabase
    .from("academic_years")
    .select("*")
    .eq("is_current", true)
    .single();

  const count = async (table: string) =>
    (await supabase.from(table).select("*", { count: "exact", head: true })).count ?? 0;

  const { count: studentCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");
  const { count: teacherCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "teacher");

  const [classes, sections, subjects, announcements, enrollments] =
    await Promise.all([
      count("classes"),
      count("sections"),
      count("subjects"),
      count("announcements"),
      year.data ? count("enrollments") : Promise.resolve(0),
    ]);

  const { data: recent } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, audience, author_id")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div>
      <PageHeader
        title="Admin Overview"
        description={
          year.data
            ? `Current session: ${year.data.name}`
            : "No current academic year set"
        }
      >
        <Link href="/dashboard/admin/years">
          <Badge variant={year.data ? "success" : "warning"}>
            {year.data ? year.data.name : "No active session"}
          </Badge>
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={studentCount ?? 0} />
        <StatCard label="Teachers" value={teacherCount ?? 0} />
        <StatCard label="Classes" value={classes} />
        <StatCard label="Sections" value={sections} />
        <StatCard label="Subjects" value={subjects} />
        <StatCard label="Active Enrollments" value={enrollments} hint="current session" />
        <StatCard label="Announcements" value={announcements} />
        <StatCard label="Past Sessions" value={0} hint="history" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!recent?.length && (
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          )}
          {recent?.map((a) => (
            <div key={a.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{a.title}</p>
                <Badge variant="secondary" className="capitalize">
                  {a.audience}
                </Badge>
              </div>
              {a.body && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {a.body}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(a.created_at)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
