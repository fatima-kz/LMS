import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import { FormShell } from "@/components/form-shell";
import { createSubject, deleteSubject } from "../actions";
import { DeleteButton } from "../_controls";

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, level")
    .order("level");

  const selectedClassId = sp.class ?? classes?.[0]?.id;

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, code, class_id, class:classes(name)")
    .order("name");

  // Group by class for the overview
  const byClass: Record<string, { id: string; name: string; code: string | null }[]> = {};
  for (const s of subjects ?? []) {
    (byClass[s.class_id] ??= []).push({ id: s.id, name: s.name, code: s.code });
  }

  return (
    <div>
      <PageHeader title="Subjects" description="Subjects are per-class. Assign teachers to them in Teaching Assignments." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Add subject</CardTitle>
          </CardHeader>
          <CardContent>
            <FormShell action={createSubject} submitLabel="Create subject">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="class_id">Class</Label>
                  <Select id="class_id" name="class_id" required defaultValue={selectedClassId}>
                    <option value="">Select class…</option>
                    {(classes ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (level {c.level})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="name">Subject name</Label>
                  <Input id="name" name="name" placeholder="Mathematics" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="code">Code (optional)</Label>
                  <Input id="code" name="code" placeholder="MATH" />
                </div>
              </div>
            </FormShell>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Subjects by class</CardTitle>
          </CardHeader>
          <CardContent>
            {!classes?.length ? (
              <EmptyState title="No classes yet" description="Create classes first." />
            ) : (
              <div className="space-y-4">
                {classes.map((c) => (
                  <div key={c.id} className="rounded-md border p-3">
                    <p className="mb-2 font-medium">{c.name} (level {c.level})</p>
                    {(byClass[c.id] ?? []).length ? (
                      <Table>
                        <THead>
                          <TRow>
                            <TH>Name</TH>
                            <TH>Code</TH>
                            <TH></TH>
                          </TRow>
                        </THead>
                        <TBody>
                          {byClass[c.id].map((s) => (
                            <TRow key={s.id}>
                              <TD className="font-medium">{s.name}</TD>
                              <TD className="text-muted-foreground">{s.code ?? "—"}</TD>
                              <TD>
                                <DeleteButton action={deleteSubject} id={s.id} />
                              </TD>
                            </TRow>
                          ))}
                        </TBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground">No subjects for this class.</p>
                    )}
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
