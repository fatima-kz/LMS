import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import { FormShell } from "@/components/form-shell";
import { createYear, rolloverYear } from "../actions";
import { formatDate } from "@/lib/utils";

export default async function YearsPage() {
  const supabase = await createClient();
  const { data: years } = await supabase
    .from("academic_years")
    .select("id, name, start_date, end_date, is_current, is_promoted, created_at")
    .order("created_at", { ascending: false });

  const current = years?.find((y) => y.is_current);

  return (
    <div>
      <PageHeader
        title="Academic Years"
        description="Sessions (1 session = 1 year). Promote students to the next session at year end."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Add academic year</CardTitle>
              <CardDescription>Create a session without promoting.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormShell action={createYear} submitLabel="Create year">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" placeholder="2026-2027" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="start_date">Start date</Label>
                    <Input id="start_date" name="start_date" type="date" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="end_date">End date</Label>
                    <Input id="end_date" name="end_date" type="date" />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="is_current" />
                    Set as current session
                  </label>
                </div>
              </FormShell>
            </CardContent>
          </Card>

          <Card className="border-amber-400/50">
            <CardHeader>
              <CardTitle className="text-amber-600">Year rollover / promotion</CardTitle>
              <CardDescription>
                Creates the new session, makes it current, and auto-promotes every active
                student to the next class level. Graduates the top level. Old session becomes
                read-only history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormShell action={rolloverYear} submitLabel="Run rollover">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="new_name">New session name</Label>
                    <Input id="new_name" name="new_name" placeholder="2026-2027" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="start_date">Start date</Label>
                    <Input id="start_date" name="start_date" type="date" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="end_date">End date</Label>
                    <Input id="end_date" name="end_date" type="date" />
                  </div>
                </div>
              </FormShell>
              {!current && (
                <p className="mt-3 text-sm text-destructive">
                  No current session set. Set one first.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>All sessions ({years?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!years?.length ? (
              <EmptyState title="No academic years yet" />
            ) : (
              <Table>
                <THead>
                  <TRow>
                    <TH>Name</TH>
                    <TH>Period</TH>
                    <TH>Status</TH>
                    <TH>Created</TH>
                  </TRow>
                </THead>
                <TBody>
                  {years.map((y) => (
                    <TRow key={y.id}>
                      <TD className="font-medium">{y.name}</TD>
                      <TD className="text-muted-foreground">
                        {y.start_date ? formatDate(y.start_date) : "—"} →{" "}
                        {y.end_date ? formatDate(y.end_date) : "—"}
                      </TD>
                      <TD>
                        <div className="flex gap-1">
                          {y.is_current && <Badge variant="success">Current</Badge>}
                          {y.is_promoted && <Badge variant="secondary">Promoted</Badge>}
                          {!y.is_current && !y.is_promoted && (
                            <Badge variant="outline">Open</Badge>
                          )}
                        </div>
                      </TD>
                      <TD className="text-muted-foreground">{formatDate(y.created_at)}</TD>
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
