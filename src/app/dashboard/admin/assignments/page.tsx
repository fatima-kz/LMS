import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import { FormShell } from "@/components/form-shell";
import { assignTeacher, deleteAssignment } from "../actions";
import { DeleteButton } from "../_controls";

export default async function AssignmentsPage({
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
  const selectedYearId =
    sp.year ?? years?.find((y) => y.is_current)?.id ?? years?.[0]?.id;
  const selectedYear = years?.find((y) => y.id === selectedYearId);

  const [teachers, subjects, sections, assignments] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("role", "teacher").order("full_name"),
    supabase.from("subjects").select("id, name").order("name"),
    supabase.from("sections").select("id, name, class:classes(name)").order("name"),
    selectedYearId
      ? supabase
          .from("teaching_assignments")
          .select(
            "id, teacher_id, subject_id, section_id, teacher:profiles(full_name), subject:subjects(name), section:sections(name, class:classes(name))",
          )
          .eq("academic_year_id", selectedYearId)
          .order("created_at")
      : Promise.resolve({ data: [] }),
  ]);

  const sectionLabel = (s: { name: string; class?: { name: string } | null }) =>
    `${s.class?.name ?? ""} — ${s.name}`;

  return (
    <div>
      <PageHeader
        title="Teaching Assignments"
        description="Assign teachers to subjects and sections. A teacher can take multiple classes and subjects."
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
          <button type="submit" className="rounded-md border px-3 py-1 text-xs hover:bg-accent">
            View
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Assign teacher{selectedYear ? ` — ${selectedYear.name}` : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedYear ? (
              <p className="text-sm text-muted-foreground">Create a session first.</p>
            ) : (
              <FormShell action={assignTeacher} submitLabel="Assign">
                <input type="hidden" name="academic_year_id" value={selectedYear.id} />
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="teacher_id">Teacher</Label>
                    <Select id="teacher_id" name="teacher_id" required>
                      <option value="">Select teacher…</option>
                      {(teachers.data ?? []).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.full_name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="subject_id">Subject</Label>
                    <Select id="subject_id" name="subject_id" required>
                      <option value="">Select subject…</option>
                      {(subjects.data ?? []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="section_id">Section</Label>
                    <Select id="section_id" name="section_id" required>
                      <option value="">Select section…</option>
                      {(sections.data ?? []).map((s) => {
                        const cls = s.class as unknown as { name: string } | null;
                        return (
                          <option key={s.id} value={s.id}>
                            {cls?.name} — {s.name}
                          </option>
                        );
                      })}
                    </Select>
                  </div>
                </div>
              </FormShell>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assignments ({assignments.data?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!assignments.data?.length ? (
              <EmptyState title="No assignments" />
            ) : (
              <Table>
                <THead>
                  <TRow>
                    <TH>Teacher</TH>
                    <TH>Subject</TH>
                    <TH>Section</TH>
                    <TH></TH>
                  </TRow>
                </THead>
                <TBody>
                  {assignments.data.map((a) => {
                    const t = a.teacher as unknown as { full_name: string } | null;
                    const sub = a.subject as unknown as { name: string } | null;
                    const sec = a.section as unknown as { name: string; class: { name: string } } | null;
                    return (
                      <TRow key={a.id}>
                        <TD className="font-medium">{t?.full_name ?? "—"}</TD>
                        <TD>{sub?.name ?? "—"}</TD>
                        <TD>{sec ? `${sec.class?.name} — ${sec.name}` : "—"}</TD>
                        <TD>
                          <DeleteButton action={deleteAssignment} id={a.id} label="Unassign" />
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
