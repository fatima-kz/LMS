import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FormShell } from "@/components/form-shell";
import { createAnnouncementTeacher } from "../actions";
import { DeleteButton } from "../../admin/_controls";
import { deleteAnnouncement } from "../../admin/actions";
import { formatDate } from "@/lib/utils";

export default async function TeacherAnnouncementsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .single();

  const { data: assignments } = await supabase
    .from("teaching_assignments")
    .select("section_id, section:sections(id, name, class:classes(name))")
    .eq("teacher_id", profile!.id)
    .eq("academic_year_id", year?.id ?? "");

  // Distinct sections.
  const seen = new Set<string>();
  const sections: { id: string; label: string }[] = [];
  for (const a of assignments ?? []) {
    const sec = a.section as unknown as { id: string; name: string; class: { name: string } } | null;
    if (sec && !seen.has(sec.id)) {
      seen.add(sec.id);
      sections.push({ id: sec.id, label: `${sec.class?.name} — ${sec.name}` });
    }
  }

  const { data: anns } = await supabase
    .from("announcements")
    .select("id, title, body, audience, created_at")
    .eq("author_id", profile!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Send to one of your sections or to all your sections."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <FormShell action={createAnnouncementTeacher} submitLabel="Send">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="body">Message</Label>
                  <Textarea id="body" name="body" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="audience">Audience</Label>
                  <Select id="audience" name="audience" required>
                    <option value="my_sections">All my sections</option>
                    <option value="section">A specific section</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="section_id">Section (if specific)</Label>
                  <Select id="section_id" name="section_id">
                    <option value="">Select section…</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </FormShell>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My announcements ({anns?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!anns?.length ? (
              <EmptyState title="No announcements sent" />
            ) : (
              <Table>
                <THead>
                  <TRow>
                    <TH>Title</TH>
                    <TH>Audience</TH>
                    <TH>Date</TH>
                    <TH></TH>
                  </TRow>
                </THead>
                <TBody>
                  {anns.map((a) => (
                    <TRow key={a.id}>
                      <TD>
                        <p className="font-medium">{a.title}</p>
                        {a.body && <p className="text-xs text-muted-foreground line-clamp-1">{a.body}</p>}
                      </TD>
                      <TD>
                        <Badge variant="secondary" className="capitalize">
                          {a.audience === "my_sections" ? "All my sections" : "Section"}
                        </Badge>
                      </TD>
                      <TD className="text-muted-foreground">{formatDate(a.created_at)}</TD>
                      <TD>
                        <DeleteButton action={deleteAnnouncement} id={a.id} />
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
