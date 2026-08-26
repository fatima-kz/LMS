import { createClient } from "@/lib/supabase/server";
import { FormShell } from "@/components/form-shell";
import { createClass, createSection, deleteClass, deleteSection } from "../actions";
import { DeleteButton } from "../_controls";

export default async function ClassesPage() {
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, level")
    .order("level");

  const classIds = (classes ?? []).map((c) => c.id);
  const { data: sections } = await supabase
    .from("sections")
    .select("id, name, class_id")
    .in("class_id", classIds.length ? classIds : ["00000000-0000-0000-0000-000000000000"])
    .order("name");

  const sectionsByClass: Record<string, { id: string; name: string }[]> = {};
  for (const s of sections ?? []) {
    (sectionsByClass[s.class_id] ??= []).push({ id: s.id, name: s.name });
  }

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
        .class-overview-card {
          transition: all 0.25s ease;
        }
        .class-overview-card:hover {
          border-color: #CCC3D8;
          background: rgba(234,221,255,0.06);
        }
        .class-overview-card:hover .class-level-badge {
          transform: scale(1.1);
        }
        .class-level-badge {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .section-chip {
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .section-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(124,58,237,0.15);
          background: #EADDFF;
        }
        .empty-icon {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .empty-icon:hover {
          transform: scale(1.1) rotate(5deg);
        }
      `}</style>

      <div>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="icon-header flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#630ED4] shadow-[0_2px_8px_rgba(124,58,237,0.2)]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1C1B1B]">Classes & Sections</h1>
              <p className="text-sm text-[#7B7487]">Grades and their sections.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add Class Form */}
          <div className="lg:col-span-1 h-fit">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white p-6 shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EADDFF]">
                  <svg className="h-4 w-4 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-[#1C1B1B]">Add class</h2>
              </div>

              <FormShell action={createClass} submitLabel="Create class">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Class name
                    </label>
                    <input
                      id="name"
                      name="name"
                      placeholder="Grade 5"
                      required
                      className="input-themed block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] placeholder-[#7B7487] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="level" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Level <span className="font-normal normal-case text-[#7B7487]">(ordering)</span>
                    </label>
                    <input
                      id="level"
                      name="level"
                      type="number"
                      placeholder="5"
                      required
                      className="input-themed block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] placeholder-[#7B7487] outline-none"
                    />
                  </div>
                </div>
              </FormShell>
            </div>
          </div>

          {/* Add Section Form */}
          <div className="lg:col-span-1 h-fit">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white p-6 shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFD600]/15">
                  <svg className="h-4 w-4 text-[#6F5C00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-[#1C1B1B]">Add section</h2>
              </div>

              <FormShell action={createSection} submitLabel="Create section">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="class_id" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Class
                    </label>
                    <select
                      id="class_id"
                      name="class_id"
                      required
                      className="input-themed block w-full appearance-none rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] outline-none"
                    >
                      <option value="">Select class…</option>
                      {(classes ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (level {c.level})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="section_name" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Section name
                    </label>
                    <input
                      id="section_name"
                      name="name"
                      placeholder="A"
                      required
                      className="input-themed block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] placeholder-[#7B7487] outline-none"
                    />
                  </div>
                </div>
              </FormShell>
            </div>
          </div>

          {/* Overview */}
          <div className="lg:col-span-1">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#EDE0FF] px-6 py-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#1C1B1B]">Overview</h2>
                  <span className="inline-flex cursor-default items-center justify-center rounded-full bg-[#7C3AED] px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {classes?.length ?? 0}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {!classes?.length ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#CCC3D8] bg-[#FDFAFF] py-12">
                    <div className="empty-icon mb-3 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#EADDFF]">
                      <svg className="h-6 w-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-[#1C1B1B]">No classes yet</p>
                    <p className="mt-1 text-xs text-[#7B7487]">Create one using the form.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {classes.map((c) => {
                      const classSections = sectionsByClass[c.id] ?? [];
                      return (
                        <div key={c.id} className="class-overview-card rounded-xl border border-[#EDE0FF] p-4">
                          {/* Class header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="class-level-badge flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#630ED4] shadow-sm">
                                <span className="text-xs font-bold text-white">{c.level}</span>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#1C1B1B]">{c.name}</p>
                                <p className="text-[10px] font-semibold text-[#7B7487]">Level {c.level}</p>
                              </div>
                            </div>
                            <DeleteButton action={deleteClass} id={c.id} label="Delete class" />
                          </div>

                          {/* Sections */}
                          <div className="flex flex-wrap gap-2">
                            {classSections.length ? (
                              classSections.map((s) => (
                                <div
                                  key={s.id}
                                  className="section-chip inline-flex items-center gap-1.5 rounded-lg border border-[#EDE0FF] bg-[#EADDFF]/30 px-3 py-1.5"
                                >
                                  <div className="flex h-5 w-5 items-center justify-center rounded bg-[#7C3AED] text-[9px] font-bold text-white">
                                    {s.name}
                                  </div>
                                  <span className="text-xs font-semibold text-[#4A4455]">Section {s.name}</span>
                                  <DeleteButton action={deleteSection} id={s.id} label="×" />
                                </div>
                              ))
                            ) : (
                              <div className="flex w-full items-center gap-2 rounded-lg bg-[#F6F3F2] px-3 py-2">
                                <svg className="h-3.5 w-3.5 text-[#CCC3D8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-[11px] font-medium text-[#7B7487]">No sections yet</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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