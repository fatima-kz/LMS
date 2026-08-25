import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FormShell } from "@/components/form-shell";
import { createUser, toggleUserActive, deleteUser } from "../actions";
import { DeleteButton, ToggleButton } from "../_controls";

export default async function TeachersPage() {
  const supabase = await createClient();
  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, is_active")
    .eq("role", "teacher")
    .order("full_name");

  // Count assignments per teacher (current year).
  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .single();
  const { data: counts } = await supabase
    .from("teaching_assignments")
    .select("teacher_id")
    .eq("academic_year_id", year?.id ?? "");
  const byTeacher: Record<string, number> = {};
  for (const t of counts ?? []) byTeacher[t.teacher_id] = (byTeacher[t.teacher_id] ?? 0) + 1;

  return (
    <div>
      <PageHeader title="Teachers" description="Add and manage teacher accounts." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Add teacher</CardTitle>
          </CardHeader>
          <CardContent>
            <FormShell action={createUser} submitLabel="Create teacher">
              <input type="hidden" name="role" value="teacher" />
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
            <CardTitle>All teachers ({teachers?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!teachers?.length ? (
              <EmptyState title="No teachers yet" description="Create one using the form." />
            ) : (
              <Table>
                <THead>
                  <TRow>
                    <TH>Name</TH>
                    <TH>Email</TH>
                    <TH>Assignments</TH>
                    <TH>Status</TH>
                    <TH></TH>
                  </TRow>
                </THead>
                <TBody>
                  {teachers.map((t) => (
                    <TRow key={t.id}>
                      <TD className="font-medium">{t.full_name}</TD>
                      <TD className="text-muted-foreground">{t.email}</TD>
                      <TD>{byTeacher[t.id] ?? 0}</TD>
                      <TD>
                        <Badge variant={t.is_active ? "success" : "secondary"}>
                          {t.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TD>
                      <TD className="flex gap-2">
                        <ToggleButton action={toggleUserActive} id={t.id} active={t.is_active} />
                        <DeleteButton action={deleteUser} id={t.id} label="Delete" />
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
