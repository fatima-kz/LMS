import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormShell } from "@/components/form-shell";
import { createClass, createSection, deleteClass, deleteSection } from "../actions";
import { DeleteButton } from "../_controls";

export default async function ClassesPage() {
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, level")
    .order("level");

  const classIds = (classes ?? []).map((c) => c.id);
  const { data: sections } = await supabase
    .from("sections")
    .select("id, name, class_id")
    .in("class_id", classIds.length ? classIds : ["00000000-0000-0000-0000-000000000000"])
    .order("name");

  const sectionsByClass: Record<string, { id: string; name: string }[]> = {};
  for (const s of sections ?? []) {
    (sectionsByClass[s.class_id] ??= []).push({ id: s.id, name: s.name });
  }

  return (
    <div>
      <PageHeader title="Classes & Sections" description="Grades and their sections." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Add class</CardTitle>
          </CardHeader>
          <CardContent>
            <FormShell action={createClass} submitLabel="Create class">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="name">Class name</Label>
                  <Input id="name" name="name" placeholder="Grade 5" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="level">Level (ordering)</Label>
                  <Input id="level" name="level" type="number" placeholder="5" required />
                </div>
              </div>
            </FormShell>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Add section</CardTitle>
          </CardHeader>
          <CardContent>
            <FormShell action={createSection} submitLabel="Create section">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="class_id">Class</Label>
                  <Select id="class_id" name="class_id" required>
                    <option value="">Select class…</option>
                    {(classes ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (level {c.level})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="name">Section name</Label>
                  <Input id="name" name="name" placeholder="A" required />
                </div>
              </div>
            </FormShell>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {!classes?.length ? (
              <EmptyState title="No classes yet" />
            ) : (
              <div className="space-y-4">
                {classes.map((c) => (
                  <div key={c.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">Level {c.level}</p>
                      </div>
                      <DeleteButton action={deleteClass} id={c.id} label="Delete class" />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(sectionsByClass[c.id] ?? []).length ? (
                        sectionsByClass[c.id].map((s) => (
                          <span key={s.id} className="inline-flex items-center gap-1">
                            <Badge variant="secondary">{s.name}</Badge>
                            <DeleteButton action={deleteSection} id={s.id} label="×" />
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No sections</span>
                      )}
                    </div>
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
