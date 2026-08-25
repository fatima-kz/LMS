import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import Link from "next/link";

export default async function TeacherClassesPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .single();

  const { data: assignments } = await supabase
    .from("teaching_assignments")
    .select(
      "id, subject:subjects(name), section:sections(id, name, class:classes(name))",
    )
    .eq("teacher_id", profile!.id)
    .eq("academic_year_id", year?.id ?? "")
    .order("created_at");

  // Student counts per section.
  const sectionIds = (assignments ?? []).map(
    (a) => (a.section as unknown as { id: string }).id,
  );
  const { data: counts } = await supabase
    .from("enrollments")
    .select("section_id")
    .in("section_id", sectionIds.length ? sectionIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("academic_year_id", year?.id ?? "")
    .eq("status", "active");
  const bySection: Record<string, number> = {};
  for (const c of counts ?? []) bySection[c.section_id] = (bySection[c.section_id] ?? 0) + 1;

  return (
    <div>
      <PageHeader title="My Classes" description="Sections and subjects you teach this session." />

      <Card>
        <CardHeader>
          <CardTitle>Assignments ({assignments?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!assignments?.length ? (
            <EmptyState title="No classes assigned" description="Ask an admin to assign you." />
          ) : (
            <Table>
              <THead>
                <TRow>
                  <TH>Class</TH>
                  <TH>Section</TH>
                  <TH>Subject</TH>
                  <TH>Students</TH>
                  <TH></TH>
                </TRow>
              </THead>
              <TBody>
                {assignments.map((a) => {
                  const sub = a.subject as unknown as { name: string } | null;
                  const sec = a.section as unknown as { id: string; name: string; class: { name: string } };
                  return (
                    <TRow key={a.id}>
                      <TD className="font-medium">{sec?.class?.name}</TD>
                      <TD>{sec?.name}</TD>
                      <TD>{sub?.name}</TD>
                      <TD>{bySection[sec.id] ?? 0}</TD>
                      <TD className="flex gap-3">
                        <Link href={`/dashboard/teacher/content?ta=${a.id}`} className="text-sm text-primary hover:underline">
                          Content
                        </Link>
                        <Link href={`/dashboard/teacher/attendance?ta=${a.id}`} className="text-sm text-primary hover:underline">
                          Attendance
                        </Link>
                      </TD>
                    </TRow>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
