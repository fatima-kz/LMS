import { createClient } from "@/lib/supabase/server";
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
    <>
      <style>{`
        .card-themed {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
        }
        .card-themed:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(124,58,237,0.12);
        }
        .rollover-card {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
        }
        .rollover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(255,77,109,0.15);
        }
        .input-themed {
          transition: all 0.2s ease;
        }
        .input-themed:focus {
          border-color: #7C3AED;
          background: white;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
        }
        .input-themed-coral:focus {
          border-color: #FF4D6D;
          background: white;
          box-shadow: 0 0 0 3px rgba(255,77,109,0.1);
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
        .empty-icon {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .empty-icon:hover {
          transform: scale(1.1) rotate(5deg);
        }
        .count-badge {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .count-badge:hover {
          transform: scale(1.15);
        }
        .checkbox-themed {
          accent-color: #7C3AED;
        }
        .rollover-icon {
          animation: rolloverPulse 3s ease-in-out infinite;
        }
        @keyframes rolloverPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        .status-dot {
          animation: statusPulse 3s ease-in-out infinite;
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="icon-header flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#630ED4] shadow-[0_2px_8px_rgba(124,58,237,0.2)]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1C1B1B]">Academic Years</h1>
              <p className="text-sm text-[#7B7487]">Sessions (1 session = 1 year). Promote students to the next session at year end.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            {/* Add Academic Year Form */}
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white p-6 shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EADDFF]">
                  <svg className="h-4 w-4 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-[#1C1B1B]">Add academic year</h2>
              </div>
              <p className="mb-5 pl-10 text-xs text-[#7B7487]">Create a session without promoting.</p>

              <FormShell action={createYear} submitLabel="Create year">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      placeholder="2026-2027"
                      required
                      className="input-themed block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] placeholder-[#7B7487] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="start_date" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Start date
                    </label>
                    <input
                      id="start_date"
                      name="start_date"
                      type="date"
                      className="input-themed block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="end_date" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      End date
                    </label>
                    <input
                      id="end_date"
                      name="end_date"
                      type="date"
                      className="input-themed block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] outline-none"
                    />
                  </div>
                  <label className="flex items-center gap-2.5 rounded-lg bg-[#F6F3F2] px-3 py-2.5 text-sm font-medium text-[#4A4455] cursor-pointer">
                    <input type="checkbox" name="is_current" className="checkbox-themed h-4 w-4 rounded" />
                    Set as current session
                  </label>
                </div>
              </FormShell>
            </div>

            {/* Year Rollover / Promotion Card */}
            <div className="rollover-card rounded-xl border-2 border-[#FF4D6D]/30 bg-white p-6 shadow-[0_4px_12px_rgba(255,77,109,0.08)]">
              <div className="mb-1 flex items-center gap-2">
                <div className="rollover-icon flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF4D6D]/15">
                  <svg className="h-4 w-4 text-[#FF4D6D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-[#FF4D6D]">Year rollover / promotion</h2>
              </div>
              <p className="mb-5 pl-10 text-xs leading-relaxed text-[#7B7487]">
                Creates the new session, makes it current, and auto-promotes every active student to the next class level. Graduates the top level. Old session becomes read-only history.
              </p>

              <FormShell action={rolloverYear} submitLabel="Run rollover">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="new_name" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      New session name
                    </label>
                    <input
                      id="new_name"
                      name="new_name"
                      placeholder="2026-2027"
                      required
                      className="input-themed-coral block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] placeholder-[#7B7487] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="rollover_start_date" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Start date
                    </label>
                    <input
                      id="rollover_start_date"
                      name="start_date"
                      type="date"
                      className="input-themed-coral block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="rollover_end_date" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      End date
                    </label>
                    <input
                      id="rollover_end_date"
                      name="end_date"
                      type="date"
                      className="input-themed-coral block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] outline-none transition-all"
                    />
                  </div>
                </div>
              </FormShell>

              {!current && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#FFDAD6] px-3 py-2.5">
                  <svg className="h-4 w-4 shrink-0 text-[#93000A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-semibold text-[#93000A]">No current session set. Set one first.</p>
                </div>
              )}
            </div>
          </div>

          {/* All Sessions Table */}
          <div className="lg:col-span-2 h-fit">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              <div className="flex items-center justify-between border-b border-[#EDE0FF] px-6 py-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#1C1B1B]">All sessions</h2>
                  <span className="count-badge inline-flex cursor-default items-center justify-center rounded-full bg-[#7C3AED] px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {years?.length ?? 0}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {!years?.length ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#CCC3D8] bg-[#FDFAFF] py-12">
                    <div className="empty-icon mb-3 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#EADDFF]">
                      <svg className="h-6 w-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-[#1C1B1B]">No academic years yet</p>
                    <p className="mt-1 text-xs text-[#7B7487]">Create one using the form.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#EDE0FF]">
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Name</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Period</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Status</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {years.map((y) => (
                          <tr key={y.id} className="table-row-themed group border-b border-[#F6F3F2] last:border-0">
                            {/* Name */}
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#630ED4]">
                                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <span className="row-name text-sm font-semibold text-[#1C1B1B] transition-colors">
                                  {y.name}
                                </span>
                              </div>
                            </td>
                            {/* Period */}
                            <td className="py-3 pr-4 text-sm text-[#7B7487]">
                              {y.start_date ? formatDate(y.start_date) : "—"}
                              {" → "}
                              {y.end_date ? formatDate(y.end_date) : "—"}
                            </td>
                            {/* Status */}
                            <td className="py-3 pr-4">
                              <div className="flex flex-wrap gap-1.5">
                                {y.is_current && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-2.5 py-0.5 text-[11px] font-bold text-[#2E7D32]">
                                    <span className="status-dot h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
                                    Current
                                  </span>
                                )}
                                {y.is_promoted && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EADDFF] px-2.5 py-0.5 text-[11px] font-bold text-[#7C3AED]">
                                    Promoted
                                  </span>
                                )}
                                {!y.is_current && !y.is_promoted && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-[#CCC3D8] px-2.5 py-0.5 text-[11px] font-bold text-[#7B7487]">
                                    Open
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* Created */}
                            <td className="py-3 pr-4 text-sm text-[#7B7487]">{formatDate(y.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}