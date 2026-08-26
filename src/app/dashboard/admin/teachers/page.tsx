import { createClient } from "@/lib/supabase/server";
import { FormShell } from "@/components/form-shell";
import { createUser, toggleUserActive, deleteUser } from "../actions";
import { DeleteButton, ToggleButton } from "../_controls";

export default async function TeachersPage() {
  const supabase = await createClient();
  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, is_active")
    .eq("role", "teacher")
    .order("full_name");

  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .single();
  const { data: counts } = await supabase
    .from("teaching_assignments")
    .select("teacher_id")
    .eq("academic_year_id", year?.id ?? "");
  const byTeacher: Record<string, number> = {};
  for (const t of counts ?? []) byTeacher[t.teacher_id] = (byTeacher[t.teacher_id] ?? 0) + 1;

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
        .status-dot {
          animation: statusPulse 3s ease-in-out infinite;
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .count-badge {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .count-badge:hover {
          transform: scale(1.15);
        }
        .icon-header {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
        }
        .icon-header:hover {
          transform: rotate(-8deg) scale(1.08);
          box-shadow: 0 4px 16px rgba(124,58,237,0.3);
        }
        .empty-icon {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .empty-icon:hover {
          transform: scale(1.1) rotate(5deg);
        }
        .assignment-chip {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .assignment-chip:hover {
          transform: scale(1.08);
        }
      `}</style>

      <div>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="icon-header flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#630ED4] shadow-[0_2px_8px_rgba(124,58,237,0.2)]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1C1B1B]">Teachers</h1>
              <p className="text-sm text-[#7B7487]">Add and manage teacher accounts.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add Teacher Form */}
          <div className="lg:col-span-1 h-fit">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white p-6 shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EADDFF]">
                  <svg className="h-4 w-4 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-[#1C1B1B]">Add teacher</h2>
              </div>

              <FormShell action={createUser} submitLabel="Create teacher">
                <input type="hidden" name="role" value="teacher" />
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="full_name" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Full name
                    </label>
                    <input
                      id="full_name"
                      name="full_name"
                      required
                      className="input-themed block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] placeholder-[#7B7487] outline-none"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="input-themed block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] placeholder-[#7B7487] outline-none"
                      placeholder="teacher@school.edu"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Initial password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      className="input-themed block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] placeholder-[#7B7487] outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Phone <span className="font-normal normal-case text-[#7B7487]">(optional)</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      className="input-themed block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] placeholder-[#7B7487] outline-none"
                      placeholder="+92 300 1234567"
                    />
                  </div>
                </div>
              </FormShell>
            </div>
          </div>

          {/* Teachers Table */}
          <div className="lg:col-span-2">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#EDE0FF] px-6 py-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#1C1B1B]">All teachers</h2>
                  <span className="count-badge inline-flex cursor-default items-center justify-center rounded-full bg-[#7C3AED] px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {teachers?.length ?? 0}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {!teachers?.length ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#CCC3D8] bg-[#FDFAFF] py-12">
                    <div className="empty-icon mb-3 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#EADDFF]">
                      <svg className="h-6 w-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-[#1C1B1B]">No teachers yet</p>
                    <p className="mt-1 text-xs text-[#7B7487]">Create one using the form.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#EDE0FF]">
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Name</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Email</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Assignments</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Status</th>
                          <th className="pb-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachers.map((t) => {
                          const assignmentCount = byTeacher[t.id] ?? 0;
                          return (
                            <tr
                              key={t.id}
                              className="table-row-themed group border-b border-[#F6F3F2] last:border-0"
                            >
                              {/* Name with avatar */}
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="avatar-mini flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#630ED4] text-[11px] font-bold text-white">
                                    {t.full_name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="row-name text-sm font-semibold text-[#1C1B1B] transition-colors">
                                    {t.full_name}
                                  </span>
                                </div>
                              </td>
                              {/* Email */}
                              <td className="py-3 pr-4 text-sm text-[#7B7487]">{t.email}</td>
                              {/* Assignments count */}
                              <td className="py-3 pr-4">
                                {assignmentCount > 0 ? (
                                  <span className="assignment-chip inline-flex cursor-default items-center gap-1 rounded-full bg-[#FFD600]/15 px-2.5 py-0.5 text-xs font-bold text-[#6F5C00]">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                                    </svg>
                                    {assignmentCount} {assignmentCount === 1 ? "class" : "classes"}
                                  </span>
                                ) : (
                                  <span className="text-sm text-[#CCC3D8]">—</span>
                                )}
                              </td>
                              {/* Status */}
                              <td className="py-3 pr-4">
                                {t.is_active ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-2.5 py-0.5 text-[11px] font-bold text-[#2E7D32]">
                                    <span className="status-dot h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F6F3F2] px-2.5 py-0.5 text-[11px] font-bold text-[#7B7487]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#7B7487]" />
                                    Inactive
                                  </span>
                                )}
                              </td>
                              {/* Actions */}
                              <td className="py-3">
                                <div className="row-actions flex justify-end gap-2 opacity-50 transition-opacity">
                                  <ToggleButton action={toggleUserActive} id={t.id} active={t.is_active} />
                                  <DeleteButton action={deleteUser} id={t.id} label="Delete" />
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