import { createClient } from "@/lib/supabase/server";
import { FormShell } from "@/components/form-shell";
import { enrollStudent, moveStudent, deleteEnrollment } from "../actions";
import { DeleteButton } from "../_controls";
import { MoveForm } from "./move-form";

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: years } = await supabase
    .from("academic_years")
    .select("id, name, is_current")
    .order("created_at", { ascending: false });

  let selectedYearId = sp.year ?? years?.find((y) => y.is_current)?.id ?? years?.[0]?.id;
  const selectedYear = years?.find((y) => y.id === selectedYearId);

  const [students, sections, classes] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("role", "student").order("full_name"),
    supabase.from("sections").select("id, name, class_id, class:classes(name)").order("name"),
    supabase.from("classes").select("id, name").order("level"),
  ]);

  const sectionOptions = (sections.data ?? []).map((s) => {
    const cls = s.class as unknown as { name: string } | null;
    return { id: s.id, label: `${cls?.name ?? ""} — ${s.name}` };
  });

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, roll_number, status, student_id, section_id, student:profiles(full_name), section:sections(name, class:classes(name))",
    )
    .eq("academic_year_id", selectedYearId ?? "")
    .order("created_at");

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.student_id));
  const availableStudents = (students.data ?? []).filter((s) => !enrolledIds.has(s.id));

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
        .table-row-themed:hover .row-actions {
          opacity: 1;
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
        .count-badge {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .count-badge:hover {
          transform: scale(1.15);
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
        .move-form-select {
          transition: all 0.2s ease;
        }
        .move-form-select:focus {
          border-color: #7C3AED;
          box-shadow: 0 0 0 2px rgba(124,58,237,0.1);
        }
        .move-btn {
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .move-btn:hover {
          background: #EADDFF;
          color: #7C3AED;
        }
        .move-btn:active {
          transform: scale(0.95);
        }
      `}</style>

      <div>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="icon-header flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#630ED4] shadow-[0_2px_8px_rgba(124,58,237,0.2)]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1C1B1B]">Enrollments</h1>
              <p className="text-sm text-[#7B7487]">Place students into sections. One section per student per session.</p>
            </div>
          </div>
        </div>

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
                {years?.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.is_current ? "(current)" : ""}
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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Enroll Student Form */}
          <div className="lg:col-span-1 h-fit">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white p-6 shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EADDFF]">
                  <svg className="h-4 w-4 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-[#1C1B1B]">
                  Enroll student
                  {selectedYear && (
                    <span className="ml-2 text-xs font-semibold text-[#7C3AED]">— {selectedYear.name}</span>
                  )}
                </h2>
              </div>

              {!selectedYear ? (
                <div className="flex items-center gap-2 rounded-lg bg-[#FFD600]/10 px-4 py-3">
                  <svg className="h-4 w-4 text-[#6F5C00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-semibold text-[#6F5C00]">Create an academic session first.</p>
                </div>
              ) : !availableStudents.length ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#CCC3D8] bg-[#FDFAFF] py-10">
                  <div className="empty-icon mb-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#EADDFF]">
                    <svg className="h-5 w-5 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-[#1C1B1B]">No students to enroll</p>
                  <p className="mt-1 px-4 text-center text-xs text-[#7B7487]">All students already enrolled this session.</p>
                </div>
              ) : (
                <FormShell action={enrollStudent} submitLabel="Enroll">
                  <input type="hidden" name="academic_year_id" value={selectedYear.id} />
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="student_id" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                        Student
                      </label>
                      <div className="select-wrapper relative">
                        <select
                          id="student_id"
                          name="student_id"
                          required
                          className="input-themed block w-full appearance-none rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 pr-10 text-sm text-[#1C1B1B] outline-none"
                        >
                          <option value="">Select student…</option>
                          {availableStudents.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.full_name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="select-chevron h-4 w-4 text-[#7B7487]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="section_id" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                        Section
                      </label>
                      <div className="select-wrapper relative">
                        <select
                          id="section_id"
                          name="section_id"
                          required
                          className="input-themed block w-full appearance-none rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 pr-10 text-sm text-[#1C1B1B] outline-none"
                        >
                          <option value="">Select section…</option>
                          {sectionOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="select-chevron h-4 w-4 text-[#7B7487]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </FormShell>
              )}
            </div>
          </div>

          {/* Enrollments Table */}
          <div className="lg:col-span-2">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              <div className="flex items-center justify-between border-b border-[#EDE0FF] px-6 py-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#1C1B1B]">Enrollments</h2>
                  <span className="count-badge inline-flex cursor-default items-center justify-center rounded-full bg-[#7C3AED] px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {enrollments?.length ?? 0}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {!enrollments?.length ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#CCC3D8] bg-[#FDFAFF] py-12">
                    <div className="empty-icon mb-3 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#EADDFF]">
                      <svg className="h-6 w-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-[#1C1B1B]">No enrollments yet</p>
                    <p className="mt-1 text-xs text-[#7B7487]">Use the form to enroll students.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#EDE0FF]">
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Student</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Class / Section</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Roll</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Status</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Move to</th>
                          <th className="pb-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollments.map((e) => {
                          const stu = e.student as unknown as { full_name: string } | null;
                          const sec = e.section as unknown as { name: string; class: { name: string } } | null;
                          const style = statusStyles[e.status] ?? defaultStatusStyle;
                          return (
                            <tr key={e.id} className="table-row-themed group border-b border-[#F6F3F2] last:border-0">
                              {/* Student */}
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
                              {/* Class/Section */}
                              <td className="py-3 pr-4">
                                {sec ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-[#EADDFF]/40 px-2 py-0.5 text-xs font-semibold text-[#7C3AED]">
                                    {sec.class?.name} — {sec.name}
                                  </span>
                                ) : (
                                  <span className="text-sm text-[#CCC3D8]">—</span>
                                )}
                              </td>
                              {/* Roll */}
                              <td className="py-3 pr-4 text-sm font-medium text-[#4A4455]">{e.roll_number ?? "—"}</td>
                              {/* Status */}
                              <td className="py-3 pr-4">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${style.bg} ${style.text}`}>
                                  <span className={`status-dot h-1.5 w-1.5 rounded-full ${style.dot}`} />
                                  {e.status}
                                </span>
                              </td>
                              {/* Move to */}
                              <td className="py-3 pr-4">
                                <MoveForm
                                  action={moveStudent}
                                  id={e.id}
                                  sections={sectionOptions}
                                  current={e.section_id}
                                />
                              </td>
                              {/* Actions */}
                              <td className="py-3">
                                <div className="row-actions flex justify-end opacity-50 transition-opacity">
                                  <DeleteButton action={deleteEnrollment} id={e.id} label="Remove" />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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