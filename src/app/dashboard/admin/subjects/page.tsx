import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import { FormShell } from "@/components/form-shell";
import { createSubject, deleteSubject } from "../actions";
import { DeleteButton } from "../_controls";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, code")
    .order("name");

  return (
    <div>
      <PageHeader title="Subjects" description="Subjects available across the school." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Add subject</CardTitle>
          </CardHeader>
          <CardContent>
            <FormShell action={createSubject} submitLabel="Create subject">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="name">Name</Label>
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
            <CardTitle>All subjects ({subjects?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!subjects?.length ? (
              <EmptyState title="No subjects yet" />
            ) : (
              <Table>
                <THead>
                  <TRow>
                    <TH>Name</TH>
                    <TH>Code</TH>
                    <TH></TH>
                  </TRow>
                </THead>
                <TBody>
                  {subjects.map((s) => (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
