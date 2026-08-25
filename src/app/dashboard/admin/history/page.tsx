import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState, StatCard } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: years } = await supabase
    .from("academic_years")
    .select("id, name, is_current, is_promoted, start_date, end_date")
    .order("created_at", { ascending: false });
  const past = (years ?? []).filter((y) => !y.is_current);

  const selectedYearId = sp.year ?? past[0]?.id;
  const selectedYear = past.find((y) => y.id === selectedYearId);

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, roll_number, status, student:profiles(full_name), section:sections(name, class:classes(name))",
    )
    .eq("academic_year_id", selectedYearId ?? "")
    .order("created_at");

  const byStatus: Record<string, number> = {};
  for (const e of enrollments ?? []) byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;

  return (
    <div>
      <PageHeader
        title="Past Sessions"
        description="Historical records. Read-only overview — editable by admins via Enrollments."
      />

      {!past.length ? (
        <EmptyState title="No past sessions" description="History appears after a year rollover." />
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2 text-sm">
            <form className="flex items-center gap-2">
              <Label>Session:</Label>
              <Select name="year" defaultValue={selectedYearId}>
                {past.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </Select>
              <button type="submit" className="rounded-md border px-3 py-1 text-xs hover:bg-accent">
                View
              </button>
            </form>
          </div>

          {selectedYear && (
            <>
              <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <StatCard label="Session" value={selectedYear.name} hint={`${formatDate(selectedYear.start_date)} → ${formatDate(selectedYear.end_date)}`} />
                <StatCard label="Total enrollments" value={enrollments?.length ?? 0} />
                <StatCard label="Graduated" value={byStatus["graduated"] ?? 0} />
              </div>

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Enrollment history — {selectedYear.name}</CardTitle>
                  <Link
                    href={`/dashboard/admin/enrollments?year=${selectedYear.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Edit enrollments →
                  </Link>
                </CardHeader>
                <CardContent>
                  <Table>
                    <THead>
                      <TRow>
                        <TH>Student</TH>
                        <TH>Class / Section</TH>
                        <TH>Roll</TH>
                        <TH>Status</TH>
                      </TRow>
                    </THead>
                    <TBody>
                      {(enrollments ?? []).map((e) => {
                        const stu = e.student as unknown as { full_name: string } | null;
                        const sec = e.section as unknown as { name: string; class: { name: string } } | null;
                        return (
                          <TRow key={e.id}>
                            <TD className="font-medium">{stu?.full_name ?? "—"}</TD>
                            <TD>{sec ? `${sec.class?.name} — ${sec.name}` : "—"}</TD>
                            <TD>{e.roll_number ?? "—"}</TD>
                            <TD>
                              <Badge variant="secondary">{e.status}</Badge>
                            </TD>
                          </TRow>
                        );
                      })}
                    </TBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
