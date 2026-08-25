import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormShell } from "@/components/form-shell";
import { createContent, deleteContent } from "../actions";
import { DeleteButton } from "../../admin/_controls";
import { formatDate } from "@/lib/utils";

export default async function TeacherContentPage({
  searchParams,
}: {
  searchParams: Promise<{ ta?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .single();

  const { data: assignments } = await supabase
    .from("teaching_assignments")
    .select("id, subject:subjects(name), section:sections(name, class:classes(name))")
    .eq("teacher_id", profile!.id)
    .eq("academic_year_id", year?.id ?? "")
    .order("created_at");

  const taId = sp.ta ?? (assignments?.[0]?.id as string | undefined);

  const { data: content } = await supabase
    .from("course_content")
    .select("id, title, description, body, content_date, is_assignment, due_date")
    .eq("teacher_id", profile!.id)
    .eq("teaching_assignment_id", taId ?? "")
    .order("content_date", { ascending: false });

  return (
    <div>
      <PageHeader title="Course Content" description="Add lessons, notes, and assignments for your classes." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New content</CardTitle>
          </CardHeader>
          <CardContent>
            <FormShell action={createContent} submitLabel="Publish">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="teaching_assignment_id">Class / Subject</Label>
                  <Select id="teaching_assignment_id" name="teaching_assignment_id" defaultValue={taId} required>
                    <option value="">Select…</option>
                    {(assignments ?? []).map((a) => {
                      const sub = a.subject as unknown as { name: string } | null;
                      const sec = a.section as unknown as { name: string; class: { name: string } } | null;
                      return (
                        <option key={a.id} value={a.id}>
                          {sec?.class?.name} — {sec?.name} · {sub?.name}
                        </option>
                      );
                    })}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="body">Body</Label>
                  <Textarea id="body" name="body" rows={4} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="content_date">Date</Label>
                  <Input id="content_date" name="content_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_assignment" />
                  This is a homework assignment
                </label>
                <div className="space-y-1">
                  <Label htmlFor="due_date">Due date (if assignment)</Label>
                  <Input id="due_date" name="due_date" type="date" />
                </div>
              </div>
            </FormShell>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Content for this class ({content?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!content?.length ? (
              <EmptyState title="No content yet" description="Publish your first lesson or assignment." />
            ) : (
              <div className="space-y-3">
                {content.map((c) => (
                  <div key={c.id} className="rounded-md border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{c.title}</p>
                        {c.description && (
                          <p className="text-sm text-muted-foreground">{c.description}</p>
                        )}
                      </div>
                      {c.is_assignment && <Badge variant="warning">Assignment · due {formatDate(c.due_date)}</Badge>}
                    </div>
                    {c.body && (
                      <p className="mt-2 whitespace-pre-wrap text-sm">{c.body}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{formatDate(c.content_date)}</span>
                      <DeleteButton action={deleteContent} id={c.id} label="Delete" />
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
