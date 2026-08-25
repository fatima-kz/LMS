import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FormShell } from "@/components/form-shell";
import { createUser, toggleUserActive, deleteUser } from "../actions";
import { DeleteButton, ToggleButton } from "../_controls";

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .single();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, is_active")
    .eq("role", "student")
    .order("full_name");

  // Map current enrollment per student.
  let enrollmentByStudent: Record<string, { class: string; section: string; roll: string | null }> = {};
  if (year?.id && students?.length) {
    const { data: enrolls } = await supabase
      .from("enrollments")
      .select("student_id, roll_number, section_id, section:sections(name, class:classes(name))")
      .eq("academic_year_id", year.id);
    for (const e of enrolls ?? []) {
      const sec = e.section as unknown as { name: string; class: { name: string } } | null;
      enrollmentByStudent[e.student_id] = {
        class: sec?.class?.name ?? "-",
        section: sec?.name ?? "-",
        roll: e.roll_number,
      };
    }
  }

  return (
    <div>
      <PageHeader title="Students" description="Add and manage student accounts." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Add student</CardTitle>
          </CardHeader>
          <CardContent>
            <FormShell action={createUser} submitLabel="Create student">
              <input type="hidden" name="role" value="student" />
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" name="full_name" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Initial password</Label>
                  <Input id="password" name="password" type="password" required minLength={6} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" name="phone" />
                </div>
              </div>
            </FormShell>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>All students ({students?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!students?.length ? (
              <EmptyState title="No students yet" description="Create one using the form." />
            ) : (
              <Table>
                <THead>
                  <TRow>
                    <TH>Name</TH>
                    <TH>Email</TH>
                    <TH>Class / Section</TH>
                    <TH>Roll</TH>
                    <TH>Status</TH>
                    <TH></TH>
                  </TRow>
                </THead>
                <TBody>
                  {students.map((s) => {
                    const e = enrollmentByStudent[s.id];
                    return (
                      <TRow key={s.id}>
                        <TD className="font-medium">{s.full_name}</TD>
                        <TD className="text-muted-foreground">{s.email}</TD>
                        <TD>
                          {e ? `${e.class} — ${e.section}` : <span className="text-muted-foreground">—</span>}
                        </TD>
                        <TD>{e?.roll ?? "—"}</TD>
                        <TD>
                          <Badge variant={s.is_active ? "success" : "secondary"}>
                            {s.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TD>
                        <TD className="flex gap-2">
                          <ToggleButton
                            action={toggleUserActive}
                            id={s.id}
                            active={s.is_active}
                          />
                          <DeleteButton action={deleteUser} id={s.id} label="Delete" />
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
