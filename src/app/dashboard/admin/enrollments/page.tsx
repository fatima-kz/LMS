import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FormShell } from "@/components/form-shell";
import { enrollStudent, moveStudent, deleteEnrollment } from "../actions";
import { DeleteButton } from "../_controls";
import { MoveForm } from "./move-form";

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: years } = await supabase
    .from("academic_years")
    .select("id, name, is_current")
    .order("created_at", { ascending: false });

  let selectedYearId = sp.year ?? years?.find((y) => y.is_current)?.id ?? years?.[0]?.id;
  const selectedYear = years?.find((y) => y.id === selectedYearId);

  const [students, sections, classes] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("role", "student").order("full_name"),
    supabase.from("sections").select("id, name, class_id, class:classes(name)").order("name"),
    supabase.from("classes").select("id, name").order("level"),
  ]);

  const sectionOptions = (sections.data ?? []).map((s) => {
    const cls = s.class as unknown as { name: string } | null;
    return { id: s.id, label: `${cls?.name ?? ""} — ${s.name}` };
  });

  // Enrollments for selected year.
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, roll_number, status, student_id, section_id, student:profiles(full_name), section:sections(name, class:classes(name))",
    )
    .eq("academic_year_id", selectedYearId ?? "")
    .order("created_at");

  // Students already enrolled this year (to exclude from the enroll form).
  const enrolledIds = new Set((enrollments ?? []).map((e) => e.student_id));
  const availableStudents = (students.data ?? []).filter((s) => !enrolledIds.has(s.id));

  return (
    <div>
      <PageHeader
        title="Enrollments"
        description="Place students into sections. One section per student per session."
      />

      <div className="mb-4 flex items-center gap-2 text-sm">
        <form className="flex items-center gap-2">
          <Label>Session:</Label>
          <Select name="year" defaultValue={selectedYearId}>
            {years?.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name} {y.is_current ? "(current)" : ""}
              </option>
            ))}
          </Select>
          <button
            type="submit"
            className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
          >
            View
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>
              Enroll student{selectedYear ? ` — ${selectedYear.name}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedYear ? (
              <p className="text-sm text-muted-foreground">Create a session first.</p>
            ) : !availableStudents.length ? (
              <EmptyState title="No students to enroll" description="All students already enrolled this session." />
            ) : (
              <FormShell action={enrollStudent} submitLabel="Enroll">
                <input type="hidden" name="academic_year_id" value={selectedYear.id} />
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="student_id">Student</Label>
                    <Select id="student_id" name="student_id" required>
                      <option value="">Select student…</option>
                      {availableStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="section_id">Section</Label>
                    <Select id="section_id" name="section_id" required>
                      <option value="">Select section…</option>
                      {sectionOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </FormShell>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Enrollments ({enrollments?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!enrollments?.length ? (
              <EmptyState title="No enrollments" />
            ) : (
              <Table>
                <THead>
                  <TRow>
                    <TH>Student</TH>
                    <TH>Class / Section</TH>
                    <TH>Roll</TH>
                    <TH>Status</TH>
                    <TH>Move to</TH>
                    <TH></TH>
                  </TRow>
                </THead>
                <TBody>
                  {enrollments.map((e) => {
                    const stu = e.student as unknown as { full_name: string } | null;
                    const sec = e.section as unknown as { name: string; class: { name: string } } | null;
                    return (
                      <TRow key={e.id}>
                        <TD className="font-medium">{stu?.full_name ?? "—"}</TD>
                        <TD>{sec ? `${sec.class?.name} — ${sec.name}` : "—"}</TD>
                        <TD>{e.roll_number ?? "—"}</TD>
                        <TD>
                          <Badge
                            variant={
                              e.status === "active"
                                ? "success"
                                : e.status === "graduated"
                                  ? "warning"
                                  : "secondary"
                            }
                          >
                            {e.status}
                          </Badge>
                        </TD>
                        <TD>
                          <MoveForm
                            action={moveStudent}
                            id={e.id}
                            sections={sectionOptions}
                            current={e.section_id}
                          />
                        </TD>
                        <TD>
                          <DeleteButton action={deleteEnrollment} id={e.id} label="Remove" />
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
    </div>
  );
}
