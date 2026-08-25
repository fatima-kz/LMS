import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function StudentAnnouncementsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: anns } = await supabase
    .from("announcements")
    .select("id, title, body, audience, created_at, author:profiles(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Announcements" description="Messages from your school and teachers." />

      {!anns?.length ? (
        <EmptyState title="No announcements" />
      ) : (
        <div className="space-y-3">
          {anns.map((a) => {
            const author = a.author as unknown as { full_name: string } | null;
            return (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{a.title}</p>
                    <Badge variant="secondary" className="capitalize">
                      {a.audience === "my_sections" ? "Your class" : a.audience}
                    </Badge>
                  </div>
                  {a.body && <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {author?.full_name ?? "—"} · {formatDate(a.created_at)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
