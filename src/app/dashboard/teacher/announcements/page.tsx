import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "../../admin/_controls";
import { deleteAnnouncement } from "../../admin/actions";
import { TeacherAnnouncementForm } from "./announcement-form";
import { formatDate } from "@/lib/utils";

export default async function TeacherAnnouncementsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .maybeSingle();

  const { data: assignments } = await supabase
    .from("teaching_assignments")
    .select("section_id, section:sections(id, name, class:classes(name))")
    .eq("teacher_id", profile.id)
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

  // Show ALL announcements visible to this teacher (RLS filters):
  // admin school-wide, admin section-targeted (to their sections), and their own.
  const { data: anns } = await supabase
    .from("announcements")
    .select("id, title, body, audience, created_at, author_id, author:profiles(full_name, role)")
    .order("created_at", { ascending: false });

  // Split into "from school/admin" and "my announcements"
  const myAnns = (anns ?? []).filter((a) => a.author_id === profile.id);
  const schoolAnns = (anns ?? []).filter((a) => a.author_id !== profile.id);

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Send to all your sections or a specific one. School-wide announcements from admin appear below."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <TeacherAnnouncementForm sections={sections} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {/* School / Admin announcements */}
          {schoolAnns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>From school ({schoolAnns.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {schoolAnns.map((a) => {
                    const author = a.author as unknown as { full_name: string; role: string } | null;
                    return (
                      <div key={a.id} className="rounded-md border p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{a.title}</p>
                          <Badge variant="default" className="capitalize">
                            {a.audience === "school" ? "Whole school" : a.audience === "my_sections" ? "Your class" : "Section"}
                          </Badge>
                        </div>
                        {a.body && <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {author?.full_name ?? "—"} · {formatDate(a.created_at)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* My announcements */}
          <Card>
            <CardHeader>
              <CardTitle>My announcements ({myAnns.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {!myAnns.length ? (
                <EmptyState title="No announcements sent" description="Send your first announcement using the form." />
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
                    {myAnns.map((a) => (
                      <TRow key={a.id}>
                        <TD>
                          <p className="font-medium">{a.title}</p>
                          {a.body && <p className="text-xs text-muted-foreground line-clamp-1">{a.body}</p>}
                        </TD>
                        <TD>
                          <Badge variant="secondary">
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
    </div>
  );
}
