import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormShell } from "@/components/form-shell";
import { createDiary, deleteDiary, updateDiaryStatus } from "../actions";
import { DeleteButton } from "../../admin/_controls";
import { ToggleButton } from "../../admin/_controls";
import { formatDate } from "@/lib/utils";

export default async function DiaryPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .single();

  // Get the student's class to filter subjects
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("section_id, section:sections(class_id)")
    .eq("student_id", profile!.id)
    .eq("academic_year_id", year?.id ?? "")
    .eq("status", "active")
    .single();

  const classId = (enrollment?.section as unknown as { class_id: string } | null)?.class_id ?? "";

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("class_id", classId)
    .order("name");

  const { data: entries } = await supabase
    .from("daily_diary_entries")
    .select("id, title, description, entry_date, due_date, status, subject_id, subject:subjects(name)")
    .eq("student_id", profile!.id)
    .eq("academic_year_id", year?.id ?? "")
    .order("entry_date", { ascending: false });

  return (
    <div>
      <PageHeader title="Daily Diary" description="Your homework and daily notes for this session." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New entry</CardTitle>
          </CardHeader>
          <CardContent>
            <FormShell action={createDiary} submitLabel="Add entry">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required placeholder="Math homework" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="subject_id">Subject (optional)</Label>
                  <Select id="subject_id" name="subject_id">
                    <option value="">—</option>
                    {(subjects ?? []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="entry_date">Date</Label>
                    <Input id="entry_date" name="entry_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="due_date">Due date</Label>
                    <Input id="due_date" name="due_date" type="date" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <Select id="status" name="status">
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </Select>
                </div>
              </div>
            </FormShell>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Diary entries ({entries?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!entries?.length ? (
              <EmptyState title="No entries yet" description="Add your first diary entry." />
            ) : (
              <div className="space-y-3">
                {entries.map((e) => {
                  const sub = e.subject as unknown as { name: string } | null;
                  return (
                    <div key={e.id} className="rounded-md border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{e.title}</p>
                          {e.description && (
                            <p className="text-sm text-muted-foreground">{e.description}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(e.entry_date)}
                            {e.due_date && ` · due ${formatDate(e.due_date)}`}
                            {sub?.name && ` · ${sub.name}`}
                          </p>
                        </div>
                        <Badge variant={e.status === "completed" ? "success" : "warning"}>
                          {e.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <ToggleButton
                          action={updateDiaryStatus}
                          id={e.id}
                          active={e.status === "pending"}
                          activeLabel="Mark completed"
                          inactiveLabel="Mark pending"
                          extra={{ status: e.status === "pending" ? "completed" : "pending" }}
                        />
                        <DeleteButton action={deleteDiary} id={e.id} label="Delete" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
