import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function StudentCoursesPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id, name")
    .eq("is_current", true)
    .single();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("section_id, section:sections(name, class:classes(name))")
    .eq("student_id", profile!.id)
    .eq("academic_year_id", year?.id ?? "")
    .eq("status", "active")
    .single();

  if (!enrollment) {
    return (
      <div>
        <PageHeader title="Courses" />
        <EmptyState title="You are not enrolled" description="Ask an admin to enroll you in a section." />
      </div>
    );
  }

  const sectionId = enrollment.section_id;
  const sec = enrollment.section as unknown as { name: string; class: { name: string } } | null;

  const { data: assignments } = await supabase
    .from("teaching_assignments")
    .select("id, subject:subjects(name), teacher:profiles(full_name)")
    .eq("section_id", sectionId)
    .eq("academic_year_id", year?.id ?? "");

  const taIds = (assignments ?? []).map((a) => a.id);
  const { data: content } = await supabase
    .from("course_content")
    .select("id, title, description, body, content_date, is_assignment, due_date, teaching_assignment_id")
    .in("teaching_assignment_id", taIds.length ? taIds : ["00000000-0000-0000-0000-000000000000"])
    .order("content_date", { ascending: false });

  const subjectByTa: Record<string, string> = {};
  const teacherByTa: Record<string, string> = {};
  for (const a of assignments ?? []) {
    const sub = a.subject as unknown as { name: string } | null;
    const t = a.teacher as unknown as { full_name: string } | null;
    subjectByTa[a.id] = sub?.name ?? "—";
    teacherByTa[a.id] = t?.full_name ?? "—";
  }

  return (
    <div>
      <PageHeader
        title="Courses"
        description={`${sec?.class?.name} — ${sec?.name} · ${year?.name ?? ""}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lessons & assignments ({content?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!content?.length ? (
            <EmptyState title="No content published yet" />
          ) : (
            <div className="space-y-3">
              {content.map((c) => (
                <div key={c.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {subjectByTa[c.teaching_assignment_id]} · by {teacherByTa[c.teaching_assignment_id]}
                      </p>
                    </div>
                    {c.is_assignment && (
                      <Badge variant="warning">Assignment · due {formatDate(c.due_date)}</Badge>
                    )}
                  </div>
                  {c.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  )}
                  {c.body && <p className="mt-2 whitespace-pre-wrap text-sm">{c.body}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(c.content_date)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
