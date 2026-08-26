import { createClient } from "@/lib/supabase/server";
import { FormShell } from "@/components/form-shell";
import { assignTeacher, deleteAssignment } from "../actions";
import { DeleteButton } from "../_controls";

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; section?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: years } = await supabase
    .from("academic_years")
    .select("id, name, is_current")
    .order("created_at", { ascending: false });
  const selectedYearId =
    sp.year ?? years?.find((y) => y.is_current)?.id ?? years?.[0]?.id;
  const selectedYear = years?.find((y) => y.id === selectedYearId);

  const [teachers, sections, assignments] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("role", "teacher").order("full_name"),
    supabase.from("sections").select("id, name, class_id, class:classes(name)").order("name"),
    selectedYearId
      ? supabase
          .from("teaching_assignments")
          .select(
            "id, teacher_id, subject_id, section_id, teacher:profiles(full_name), subject:subjects(name, class:classes(name)), section:sections(name, class:classes(name))",
          )
          .eq("academic_year_id", selectedYearId)
          .order("created_at")
      : Promise.resolve({ data: [] }),
  ]);

  const selectedSectionId = sp.section ?? "";
  const selectedSection = (sections.data ?? []).find((s) => s.id === selectedSectionId);
  const selectedClassId = selectedSection?.class_id ?? "";

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, code, class_id, class:classes(name)")
    .eq(selectedClassId ? "class_id" : "school_id", selectedClassId || "")
    .order("name");

  const sectionLabel = (s: { name: string; class?: { name: string } | null }) =>
    `${s.class?.name ?? ""} — ${s.name}`;

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
        .session-chip {
          transition: all 0.2s ease;
        }
        .session-chip:hover {
          background: rgba(234,221,255,0.5);
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
        .step-badge {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .step-badge:hover {
          transform: scale(1.15);
        }
        .info-bar {
          transition: all 0.2s ease;
        }
        .info-bar:hover {
          background: rgba(234,221,255,0.25);
        }
      `}</style>

      <div>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="icon-header flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#630ED4] shadow-[0_2px_8px_rgba(124,58,237,0.2)]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1C1B1B]">Teaching Assignments</h1>
              <p className="text-sm text-[#7B7487]">Pick a section, then assign a teacher to one of that class's subjects.</p>
            </div>
          </div>
        </div>

        {/* Session Selector Bar */}
        <div className="mb-6">
          <form className="info-bar inline-flex items-center gap-3 rounded-xl border border-[#EDE0FF] bg-white px-4 py-3 shadow-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFD600]/15">
              <svg className="h-3.5 w-3.5 text-[#6F5C00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-wide text-[#4A4455]">Session</span>
            <select
              name="year"
              defaultValue={selectedYearId}
              className="input-themed appearance-none rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2 text-sm font-semibold text-[#1C1B1B] outline-none"
            >
              {years?.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.is_current ? "(current)" : ""}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="filter-btn rounded-lg bg-[#7C3AED] px-4 py-2 text-xs font-bold text-white"
            >
              View
            </button>
          </form>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Assign Teacher Form */}
          <div className="lg:col-span-1 h-fit">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white p-6 shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EADDFF]">
                  <svg className="h-4 w-4 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-[#1C1B1B]">
                  Assign teacher
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
              ) : (
                <>
                  {/* Step 1: Pick section */}
                  <form className="mb-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="step-badge flex h-5 w-5 items-center justify-center rounded-full bg-[#FF4D6D] text-[10px] font-bold text-white">1</span>
                      <label className="text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                        Pick section <span className="font-normal normal-case text-[#7B7487]">(filters subjects)</span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <select
                        name="section"
                        defaultValue={selectedSectionId}
                        className="input-themed block flex-1 appearance-none rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] outline-none"
                      >
                        <option value="">Select section…</option>
                        {(sections.data ?? []).map((s) => {
                          const cls = s.class as unknown as { name: string } | null;
                          return (
                            <option key={s.id} value={s.id}>
                              {cls?.name} — {s.name}
                            </option>
                          );
                        })}
                      </select>
                      <input type="hidden" name="year" value={selectedYearId} />
                      <button
                        type="submit"
                        className="filter-btn rounded-lg border-2 border-[#EDE0FF] px-4 py-2.5 text-xs font-bold text-[#7C3AED] transition-all hover:border-[#7C3AED] hover:bg-[#7C3AED] hover:text-white"
                      >
                        Filter
                      </button>
                    </div>
                  </form>

                  {/* Step 2: Assign */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="step-badge flex h-5 w-5 items-center justify-center rounded-full bg-[#7C3AED] text-[10px] font-bold text-white">2</span>
                    <span className="text-xs font-bold uppercase tracking-wide text-[#4A4455]">Assign</span>
                  </div>

                  <FormShell action={assignTeacher} submitLabel="Assign">
                    <input type="hidden" name="academic_year_id" value={selectedYear.id} />
                    <input type="hidden" name="section_id" value={selectedSectionId} />
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label htmlFor="teacher_id" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                          Teacher
                        </label>
                        <select
                          id="teacher_id"
                          name="teacher_id"
                          required
                          className="input-themed block w-full appearance-none rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] outline-none"
                        >
                          <option value="">Select teacher…</option>
                          {(teachers.data ?? []).map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.full_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="subject_id" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                          Subject
                        </label>
                        <select
                          id="subject_id"
                          name="subject_id"
                          required
                          disabled={!selectedSectionId}
                          className="input-themed block w-full appearance-none rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">
                            {selectedSectionId ? "Select subject…" : "Pick a section first"}
                          </option>
                          {(subjects ?? []).map((s) => {
                            const cls = s.class as unknown as { name: string } | null;
                            return (
                              <option key={s.id} value={s.id}>
                                {cls?.name} — {s.name}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {selectedSectionId && (
                        <div className="flex items-center gap-2 rounded-lg bg-[#EADDFF]/30 px-3 py-2">
                          <svg className="h-3.5 w-3.5 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-xs font-semibold text-[#7C3AED]">
                            Assigning to: {sectionLabel(selectedSection as unknown as { name: string; class: { name: string } | null })}
                          </p>
                        </div>
                      )}
                    </div>
                  </FormShell>
                </>
              )}
            </div>
          </div>

          {/* Assignments Table */}
          <div className="lg:col-span-2">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#EDE0FF] px-6 py-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#1C1B1B]">Assignments</h2>
                  <span className="inline-flex cursor-default items-center justify-center rounded-full bg-[#7C3AED] px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {assignments.data?.length ?? 0}
                  </span>
                </div>
                {selectedYear && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFD600]/15 px-3 py-1 text-[11px] font-bold text-[#6F5C00]">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {selectedYear.name}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {!assignments.data?.length ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#CCC3D8] bg-[#FDFAFF] py-12">
                    <div className="empty-icon mb-3 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#EADDFF]">
                      <svg className="h-6 w-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-[#1C1B1B]">No assignments yet</p>
                    <p className="mt-1 text-xs text-[#7B7487]">Use the form to assign teachers.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#EDE0FF]">
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Teacher</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Subject</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Section</th>
                          <th className="pb-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.data.map((a) => {
                          const t = a.teacher as unknown as { full_name: string } | null;
                          const sub = a.subject as unknown as { name: string; class: { name: string } } | null;
                          const sec = a.section as unknown as { name: string; class: { name: string } } | null;
                          return (
                            <tr key={a.id} className="table-row-themed group border-b border-[#F6F3F2] last:border-0">
                              {/* Teacher */}
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="avatar-mini flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#630ED4] text-[11px] font-bold text-white">
                                    {t?.full_name?.charAt(0).toUpperCase() ?? "?"}
                                  </div>
                                  <span className="row-name text-sm font-semibold text-[#1C1B1B] transition-colors">
                                    {t?.full_name ?? "—"}
                                  </span>
                                </div>
                              </td>
                              {/* Subject */}
                              <td className="py-3 pr-4">
                                {sub ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-[#EADDFF]/40 px-2 py-0.5 text-xs font-semibold text-[#7C3AED]">
                                    {sub.class?.name} — {sub.name}
                                  </span>
                                ) : (
                                  <span className="text-sm text-[#CCC3D8]">—</span>
                                )}
                              </td>
                              {/* Section */}
                              <td className="py-3 pr-4">
                                {sec ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-[#FFD600]/15 px-2 py-0.5 text-xs font-semibold text-[#6F5C00]">
                                    {sec.class?.name} — {sec.name}
                                  </span>
                                ) : (
                                  <span className="text-sm text-[#CCC3D8]">—</span>
                                )}
                              </td>
                              {/* Actions */}
                              <td className="py-3">
                                <div className="row-actions flex justify-end opacity-50 transition-opacity">
                                  <DeleteButton action={deleteAssignment} id={a.id} label="Unassign" />
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