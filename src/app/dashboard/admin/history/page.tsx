import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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

  const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", dot: "bg-[#2E7D32]" },
    graduated: { bg: "bg-[#FFD600]/15", text: "text-[#6F5C00]", dot: "bg-[#6F5C00]" },
  };
  const defaultStatusStyle = { bg: "bg-[#F6F3F2]", text: "text-[#7B7487]", dot: "bg-[#7B7487]" };

  return (
    <>
      <style>{`
        .card-themed {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
        }
        .card-themed:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(124,58,237,0.12);
        }
        .input-themed {
          transition: all 0.2s ease;
        }
        .input-themed:focus {
          border-color: #7C3AED;
          background: white;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
        }
        .select-wrapper:focus-within .select-chevron {
          color: #7C3AED;
          transform: rotate(180deg);
        }
        .select-chevron {
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .icon-header {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
        }
        .icon-header:hover {
          transform: rotate(-8deg) scale(1.08);
          box-shadow: 0 4px 16px rgba(124,58,237,0.3);
        }
        .table-row-themed {
          transition: all 0.2s ease;
        }
        .table-row-themed:hover {
          background: rgba(234,221,255,0.15);
        }
        .table-row-themed:hover .row-name {
          color: #7C3AED;
        }
        .table-row-themed:hover .avatar-mini {
          transform: scale(1.1);
        }
        .avatar-mini {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .empty-icon {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .empty-icon:hover {
          transform: scale(1.1) rotate(5deg);
        }
        .filter-btn {
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .filter-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(124,58,237,0.2);
        }
        .filter-btn:active {
          transform: scale(0.97);
        }
        .status-dot {
          animation: statusPulse 3s ease-in-out infinite;
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .stat-card {
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(124,58,237,0.14);
        }
        .stat-icon {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .stat-card:hover .stat-icon {
          transform: scale(1.12) rotate(-5deg);
        }
        .edit-link {
          transition: all 0.2s ease;
        }
        .edit-link:hover {
          gap: 8px;
        }
        .edit-link svg {
          transition: transform 0.2s ease;
        }
        .edit-link:hover svg {
          transform: translateX(2px);
        }
      `}</style>

      <div>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="icon-header flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#630ED4] shadow-[0_2px_8px_rgba(124,58,237,0.2)]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1C1B1B]">Past Sessions</h1>
              <p className="text-sm text-[#7B7487]">Historical records. Read-only overview — editable by admins via Enrollments.</p>
            </div>
          </div>
        </div>

        {!past.length ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#CCC3D8] bg-[#FDFAFF] py-16">
            <div className="empty-icon mb-3 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#EADDFF]">
              <svg className="h-7 w-7 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-[#1C1B1B]">No past sessions</p>
            <p className="mt-1 text-xs text-[#7B7487]">History appears after a year rollover.</p>
          </div>
        ) : (
          <>
            {/* Session Selector Bar */}
            <div className="mb-6">
              <form className="inline-flex items-center gap-3 rounded-xl border border-[#EDE0FF] bg-white px-4 py-3 shadow-sm transition-colors hover:bg-[#EADDFF]/10">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFD600]/15">
                  <svg className="h-3.5 w-3.5 text-[#6F5C00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-bold uppercase tracking-wide text-[#4A4455]">Session</span>
                <div className="select-wrapper relative">
                  <select
                    name="year"
                    defaultValue={selectedYearId}
                    className="input-themed appearance-none rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2 pr-9 text-sm font-semibold text-[#1C1B1B] outline-none"
                  >
                    {past.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                    <svg className="select-chevron h-4 w-4 text-[#7B7487]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <button
                  type="submit"
                  className="filter-btn rounded-lg bg-[#7C3AED] px-4 py-2 text-xs font-bold text-white"
                >
                  View
                </button>
              </form>
            </div>

            {selectedYear && (
              <>
                {/* Stat Cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                  {/* Session card */}
                  <div className="stat-card rounded-xl border border-[#EDE0FF] bg-white p-5 shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
                    <div className="mb-3 flex items-center gap-2.5">
                      <div className="stat-icon flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#630ED4]">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Session</span>
                    </div>
                    <p className="text-xl font-extrabold text-[#1C1B1B]">{selectedYear.name}</p>
                    <p className="mt-1 text-xs font-medium text-[#7B7487]">
                      {formatDate(selectedYear.start_date)} → {formatDate(selectedYear.end_date)}
                    </p>
                  </div>

                  {/* Total enrollments card */}
                  <div className="stat-card rounded-xl border border-[#EDE0FF] bg-white p-5 shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
                    <div className="mb-3 flex items-center gap-2.5">
                      <div className="stat-icon flex h-9 w-9 items-center justify-center rounded-lg bg-[#EADDFF]">
                        <svg className="h-4 w-4 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Total enrollments</span>
                    </div>
                    <p className="text-xl font-extrabold text-[#1C1B1B]">{enrollments?.length ?? 0}</p>
                  </div>

                  {/* Graduated card */}
                  <div className="stat-card rounded-xl border border-[#EDE0FF] bg-white p-5 shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
                    <div className="mb-3 flex items-center gap-2.5">
                      <div className="stat-icon flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFD600]/15">
                        <svg className="h-4 w-4 text-[#6F5C00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Graduated</span>
                    </div>
                    <p className="text-xl font-extrabold text-[#1C1B1B]">{byStatus["graduated"] ?? 0}</p>
                  </div>
                </div>

                {/* Enrollment History Table */}
                <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
                  <div className="flex items-center justify-between border-b border-[#EDE0FF] px-6 py-4">
                    <h2 className="text-base font-bold text-[#1C1B1B]">
                      Enrollment history <span className="ml-1 text-xs font-semibold text-[#7C3AED]">— {selectedYear.name}</span>
                    </h2>
                    <Link
                      href={`/dashboard/admin/enrollments?year=${selectedYear.id}`}
                      className="edit-link flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:text-[#630ED4]"
                    >
                      Edit enrollments
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>

                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#EDE0FF]">
                            <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Student</th>
                            <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Class / Section</th>
                            <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Roll</th>
                            <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(enrollments ?? []).map((e) => {
                            const stu = e.student as unknown as { full_name: string } | null;
                            const sec = e.section as unknown as { name: string; class: { name: string } } | null;
                            const style = statusStyles[e.status] ?? defaultStatusStyle;
                            return (
                              <tr key={e.id} className="table-row-themed group border-b border-[#F6F3F2] last:border-0">
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="avatar-mini flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#630ED4] text-[11px] font-bold text-white">
                                      {stu?.full_name?.charAt(0).toUpperCase() ?? "?"}
                                    </div>
                                    <span className="row-name text-sm font-semibold text-[#1C1B1B] transition-colors">
                                      {stu?.full_name ?? "—"}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 pr-4">
                                  {sec ? (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-[#EADDFF]/40 px-2 py-0.5 text-xs font-semibold text-[#7C3AED]">
                                      {sec.class?.name} — {sec.name}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-[#CCC3D8]">—</span>
                                  )}
                                </td>
                                <td className="py-3 pr-4 text-sm font-medium text-[#4A4455]">{e.roll_number ?? "—"}</td>
                                <td className="py-3 pr-4">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${style.bg} ${style.text}`}>
                                    <span className={`status-dot h-1.5 w-1.5 rounded-full ${style.dot}`} />
                                    {e.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}