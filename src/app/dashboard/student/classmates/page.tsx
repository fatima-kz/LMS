import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import { Avatar } from "@/components/ui/misc";

export default async function ClassmatesPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id, name")
    .eq("is_current", true)
    .single();

  const { data: mine } = await supabase
    .from("enrollments")
    .select("section_id, section:sections(name, class:classes(name))")
    .eq("student_id", profile!.id)
    .eq("academic_year_id", year?.id ?? "")
    .eq("status", "active")
    .single();

  if (!mine) {
    return (
      <div>
        <PageHeader title="Classmates" />
        <EmptyState title="You are not enrolled" />
      </div>
    );
  }

  const sec = mine.section as unknown as { name: string; class: { name: string } } | null;

  const { data: peers } = await supabase
    .from("enrollments")
    .select("roll_number, student_id, student:profiles(full_name)")
    .eq("section_id", mine.section_id)
    .eq("academic_year_id", year?.id ?? "")
    .eq("status", "active")
    .order("roll_number");

  return (
    <div>
      <PageHeader
        title="Classmates"
        description={`${sec?.class?.name} — ${sec?.name} · ${year?.name ?? ""}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Students ({peers?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!peers?.length ? (
            <EmptyState title="No classmates" />
          ) : (
            <Table>
              <THead>
                <TRow>
                  <TH>Roll</TH>
                  <TH>Name</TH>
                </TRow>
              </THead>
              <TBody>
                {peers.map((p) => {
                  const stu = p.student as unknown as { full_name: string } | null;
                  return (
                    <TRow key={p.student_id}>
                      <TD>{p.roll_number ?? "—"}</TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          <Avatar name={stu?.full_name} className="h-7 w-7 text-xs" />
                          <span className="font-medium">{stu?.full_name ?? "—"}</span>
                        </div>
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
  );
}
