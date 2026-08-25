import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/misc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function TeacherOverview() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: year } = await supabase
    .from("academic_years")
    .select("id, name")
    .eq("is_current", true)
    .single();

  const { data: assignments } = await supabase
    .from("teaching_assignments")
    .select(
      "id, subject_id, section_id, subject:subjects(name), section:sections(name, class:classes(name))",
    )
    .eq("teacher_id", profile!.id)
    .eq("academic_year_id", year?.id ?? "");

  const sectionIds = (assignments ?? []).map((a) => a.section_id);
  const { count: contentCount } = await supabase
    .from("course_content")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", profile!.id);

  const { count: studentCount } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .in("section_id", sectionIds.length ? sectionIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("academic_year_id", year?.id ?? "")
    .eq("status", "active");

  const distinctSections = new Set(sectionIds).size;
  const distinctSubjects = new Set((assignments ?? []).map((a) => a.subject_id)).size;

  const { data: pending } = await supabase
    .from("course_content")
    .select("id, title, due_date, section_id")
    .eq("teacher_id", profile!.id)
    .eq("is_assignment", true)
    .order("due_date", { ascending: false })
    .limit(5);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${profile!.full_name.split(" ")[0]}`}
        description={year ? `Current session: ${year.name}` : "No current session"}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Classes (sections)" value={distinctSections} />
        <StatCard label="Subjects" value={distinctSubjects} />
        <StatCard label="Students" value={studentCount ?? 0} />
        <StatCard label="Content items" value={contentCount ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My teaching assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {!assignments?.length ? (
              <EmptyState title="No assignments" description="An admin must assign you to classes." />
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => {
                  const sub = a.subject as unknown as { name: string } | null;
                  const sec = a.section as unknown as { name: string; class: { name: string } } | null;
                  return (
                    <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="font-medium">
                          {sec?.class?.name} — {sec?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">{sub?.name}</p>
                      </div>
                      <Link
                        href={`/dashboard/teacher/content?ta=${a.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Add content →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {!pending?.length ? (
              <EmptyState title="No assignments posted" />
            ) : (
              <div className="space-y-2">
                {pending.map((p) => (
                  <div key={p.id} className="rounded-md border p-3">
                    <p className="font-medium">{p.title}</p>
                    <Badge variant="secondary" className="mt-1">
                      Due {p.due_date ?? "—"}
                    </Badge>
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
