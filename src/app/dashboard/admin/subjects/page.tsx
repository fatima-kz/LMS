import { createClient } from "@/lib/supabase/server";
import { FormShell } from "@/components/form-shell";
import { createSubject, deleteSubject } from "../actions";
import { DeleteButton } from "../_controls";

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, level")
    .order("level");

  const selectedClassId = sp.class ?? classes?.[0]?.id;

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, code, class_id, class:classes(name)")
    .order("name");

  const byClass: Record<string, { id: string; name: string; code: string | null }[]> = {};
  for (const s of subjects ?? []) {
    (byClass[s.class_id] ??= []).push({ id: s.id, name: s.name, code: s.code });
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
        .class-card {
          transition: all 0.25s ease;
        }
        .class-card:hover {
          border-color: #CCC3D8;
          background: rgba(234,221,255,0.06);
        }
        .subject-row {
          transition: all 0.2s ease;
        }
        .subject-row:hover {
          background: rgba(234,221,255,0.15);
        }
        .subject-row:hover .subject-name {
          color: #7C3AED;
        }
        .subject-row:hover .subject-delete {
          opacity: 1;
        }
        .subject-row:hover .subject-icon {
          transform: scale(1.1);
        }
        .subject-icon {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .icon-header {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
        }
        .icon-header:hover {
          transform: rotate(-8deg) scale(1.08);
          box-shadow: 0 4px 16px rgba(124,58,237,0.3);
        }
        .class-badge {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .class-badge:hover {
          transform: scale(1.05);
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1C1B1B]">Subjects</h1>
              <p className="text-sm text-[#7B7487]">Subjects are per-class. Assign teachers in Teaching Assignments.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add Subject Form */}
          <div className="lg:col-span-1 h-fit">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white p-6 shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EADDFF]">
                  <svg className="h-4 w-4 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-[#1C1B1B]">Add subject</h2>
              </div>

              <FormShell action={createSubject} submitLabel="Create subject">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="class_id" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Class
                    </label>
                    <select
                      id="class_id"
                      name="class_id"
                      required
                      defaultValue={selectedClassId}
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
                    <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Subject name
                    </label>
                    <input
                      id="name"
                      name="name"
                      placeholder="Mathematics"
                      required
                      className="input-themed block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] placeholder-[#7B7487] outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="code" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Code <span className="font-normal normal-case text-[#7B7487]">(optional)</span>
                    </label>
                    <input
                      id="code"
                      name="code"
                      placeholder="MATH"
                      className="input-themed block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] placeholder-[#7B7487] outline-none"
                    />
                  </div>
                </div>
              </FormShell>
            </div>
          </div>

          {/* Subjects by Class */}
          <div className="lg:col-span-2">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#EDE0FF] px-6 py-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#1C1B1B]">Subjects by class</h2>
                  <span className="inline-flex items-center justify-center rounded-full bg-[#7C3AED] px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {subjects?.length ?? 0}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {!classes?.length ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#CCC3D8] bg-[#FDFAFF] py-12">
                    <div className="empty-icon mb-3 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#EADDFF]">
                      <svg className="h-6 w-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-[#1C1B1B]">No classes yet</p>
                    <p className="mt-1 text-xs text-[#7B7487]">Create classes first.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {classes.map((c) => {
                      const classSubjects = byClass[c.id] ?? [];
                      return (
                        <div key={c.id} className="class-card rounded-xl border border-[#EDE0FF] p-4">
                          {/* Class label */}
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#630ED4]">
                                <span className="text-[11px] font-bold text-white">{c.level}</span>
                              </div>
                              <span className="text-sm font-bold text-[#1C1B1B]">{c.name}</span>
                            </div>
                            <span className="class-badge inline-flex cursor-default items-center rounded-full bg-[#EADDFF] px-2 py-0.5 text-[10px] font-bold text-[#7C3AED]">
                              {classSubjects.length} {classSubjects.length === 1 ? "subject" : "subjects"}
                            </span>
                          </div>

                          {classSubjects.length ? (
                            <div className="overflow-hidden rounded-lg border border-[#F6F3F2]">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-[#EDE0FF] bg-[#FDFAFF]">
                                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Subject</th>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Code</th>
                                    <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {classSubjects.map((s) => (
                                    <tr key={s.id} className="subject-row group border-b border-[#F6F3F2] last:border-0">
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                          <div className="subject-icon flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFD600]/15">
                                            <svg className="h-3.5 w-3.5 text-[#6F5C00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                          </div>
                                          <span className="subject-name text-sm font-semibold text-[#1C1B1B] transition-colors">{s.name}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        {s.code ? (
                                          <span className="inline-flex items-center rounded-md bg-[#EADDFF]/40 px-2 py-0.5 text-xs font-semibold text-[#7C3AED]">
                                            {s.code}
                                          </span>
                                        ) : (
                                          <span className="text-sm text-[#CCC3D8]">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="subject-delete flex justify-end opacity-50 transition-opacity">
                                          <DeleteButton action={deleteSubject} id={s.id} />
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 rounded-lg bg-[#F6F3F2] px-4 py-3">
                              <svg className="h-4 w-4 text-[#CCC3D8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                              <p className="text-xs font-medium text-[#7B7487]">No subjects for this class yet.</p>
                            </div>
                          )}
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