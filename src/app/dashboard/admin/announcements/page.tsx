import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FormShell } from "@/components/form-shell";
import { createAnnouncementAdmin, deleteAnnouncement } from "../actions";
import { DeleteButton } from "../_controls";
import { formatDate } from "@/lib/utils";

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();
  const [sections, announcements] = await Promise.all([
    supabase.from("sections").select("id, name, class:classes(name)").order("name"),
    supabase
      .from("announcements")
      .select("id, title, body, audience, section_id, created_at, author:profiles(full_name)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Send announcements to the whole school or a specific section."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <FormShell action={createAnnouncementAdmin} submitLabel="Send">
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
                    <option value="school">Whole school</option>
                    <option value="section">Specific section</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="section_id">Section (if specific)</Label>
                  <Select id="section_id" name="section_id">
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
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>All announcements ({announcements.data?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!announcements.data?.length ? (
              <EmptyState title="No announcements" />
            ) : (
              <Table>
                <THead>
                  <TRow>
                    <TH>Title</TH>
                    <TH>Author</TH>
                    <TH>Audience</TH>
                    <TH>Date</TH>
                    <TH></TH>
                  </TRow>
                </THead>
                <TBody>
                  {announcements.data.map((a) => {
                    const author = a.author as unknown as { full_name: string } | null;
                    return (
                      <TRow key={a.id}>
                        <TD>
                          <p className="font-medium">{a.title}</p>
                          {a.body && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{a.body}</p>
                          )}
                        </TD>
                        <TD>{author?.full_name ?? "—"}</TD>
                        <TD>
                          <Badge variant="secondary" className="capitalize">
                            {a.audience}
                          </Badge>
                        </TD>
                        <TD className="text-muted-foreground">{formatDate(a.created_at)}</TD>
                        <TD>
                          <DeleteButton action={deleteAnnouncement} id={a.id} />
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
