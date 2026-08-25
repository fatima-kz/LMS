import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";

type ContentRow = {
  id: string;
  title: string;
  description: string | null;
  body: string | null;
  content_date: string;
  is_assignment: boolean;
  due_date: string | null;
  teaching_assignment_id: string;
};

type Course = {
  id: string;
  name: string;
  code: string | null;
  teacher: string | null;
  lessons: ContentRow[];
  assignments: ContentRow[];
};

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
    .select("section_id, section:sections(name, class_id, class:classes(name))")
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
  const sec = enrollment.section as unknown as {
    name: string;
    class_id: string;
    class: { name: string };
  } | null;
  const classId = sec?.class_id ?? "";

  // All subjects for this class = the courses
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, code")
    .eq("class_id", classId)
    .order("name");

  // Teaching assignments for this section+year, with subject + teacher
  const { data: tas } = await supabase
    .from("teaching_assignments")
    .select("id, subject_id, teacher:profiles(full_name)")
    .eq("section_id", sectionId)
    .eq("academic_year_id", year?.id ?? "");

  // Map subject_id -> { taId, teacher }
  const taBySubject: Record<string, { taId: string; teacher: string | null }> = {};
  for (const t of tas ?? []) {
    const teacher = t.teacher as unknown as { full_name: string } | null;
    taBySubject[t.subject_id] = { taId: t.id, teacher: teacher?.full_name ?? null };
  }

  // All content for this section's teaching assignments
  const taIds = (tas ?? []).map((t) => t.id);
  const { data: content } = await supabase
    .from("course_content")
    .select("id, title, description, body, content_date, is_assignment, due_date, teaching_assignment_id")
    .in("teaching_assignment_id", taIds.length ? taIds : ["00000000-0000-0000-0000-000000000000"])
    .order("content_date", { ascending: false });

  // Reverse map: taId -> subject_id
  const subjectByTa: Record<string, string> = {};
  for (const [subjectId, info] of Object.entries(taBySubject)) {
    subjectByTa[info.taId] = subjectId;
  }

  // Build courses
  const courses: Course[] = (subjects ?? []).map((s) => {
    const info = taBySubject[s.id];
    const subjectContent = (content ?? []).filter(
      (c) => subjectByTa[c.teaching_assignment_id] === s.id,
    ) as ContentRow[];
    return {
      id: s.id,
      name: s.name,
      code: s.code,
      teacher: info?.teacher ?? null,
      lessons: subjectContent.filter((c) => !c.is_assignment),
      assignments: subjectContent.filter((c) => c.is_assignment),
    };
  });

  return (
    <div>
      <PageHeader
        title="Courses"
        description={`${sec?.class?.name} — ${sec?.name} · ${year?.name ?? ""}`}
      />

      {!courses.length ? (
        <EmptyState title="No courses for your class" description="Subjects for your class haven't been set up yet." />
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{course.name}</CardTitle>
                    <CardDescription>
                      {course.code ? `${course.code} · ` : ""}
                      {course.teacher ? (
                        <span className="inline-flex items-center gap-1">
                          <Avatar name={course.teacher} className="h-5 w-5 text-[10px]" />
                          {course.teacher}
                        </span>
                      ) : (
                        "No teacher assigned yet"
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{course.lessons.length} lessons</span>
                    <span>·</span>
                    <span>{course.assignments.length} assignments</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!course.lessons.length && !course.assignments.length ? (
                  <p className="text-sm text-muted-foreground">No lessons or assignments posted yet.</p>
                ) : (
                  <div className="space-y-4">
                    {course.assignments.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Assignments
                        </p>
                        <div className="space-y-2">
                          {course.assignments.map((a) => (
                            <div key={a.id} className="rounded-md border border-amber-300/40 bg-amber-50/40 p-3 dark:bg-amber-950/10">
                              <div className="flex items-start justify-between">
                                <p className="font-medium">{a.title}</p>
                                <Badge variant="warning">due {formatDate(a.due_date)}</Badge>
                              </div>
                              {a.description && (
                                <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                              )}
                              {a.body && <p className="mt-2 whitespace-pre-wrap text-sm">{a.body}</p>}
                              <p className="mt-2 text-xs text-muted-foreground">{formatDate(a.content_date)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {course.lessons.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Lessons
                        </p>
                        <div className="space-y-2">
                          {course.lessons.map((l) => (
                            <div key={l.id} className="rounded-md border p-3">
                              <p className="font-medium">{l.title}</p>
                              {l.description && (
                                <p className="mt-1 text-sm text-muted-foreground">{l.description}</p>
                              )}
                              {l.body && <p className="mt-2 whitespace-pre-wrap text-sm">{l.body}</p>}
                              <p className="mt-2 text-xs text-muted-foreground">{formatDate(l.content_date)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
