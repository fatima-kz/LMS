import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Table, THead, TBody, TRow, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FormShell } from "@/components/form-shell";
import { createUser, toggleUserActive, deleteUser } from "../actions";
import { DeleteButton, ToggleButton } from "../_controls";

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .single();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, is_active")
    .eq("role", "student")
    .order("full_name");

  let enrollmentByStudent: Record<string, { class: string; section: string; roll: string | null }> = {};
  if (year?.id && students?.length) {
    const { data: enrolls } = await supabase
      .from("enrollments")
      .select("student_id, roll_number, section_id, section:sections(name, class:classes(name))")
      .eq("academic_year_id", year.id);
    for (const e of enrolls ?? []) {
      const sec = e.section as unknown as { name: string; class: { name: string } } | null;
      enrollmentByStudent[e.student_id] = {
        class: sec?.class?.name ?? "-",
        section: sec?.name ?? "-",
        roll: e.roll_number,
      };
    }
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
        .btn-primary-themed {
          position: relative;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .btn-primary-themed:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(124,58,237,0.35);
        }
        .btn-primary-themed:active {
          transform: scale(0.97);
        }
        .btn-primary-themed::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%);
          background-size: 200% 100%;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .btn-primary-themed:hover::after {
          opacity: 1;
          animation: btnShimmer 1.5s linear infinite;
        }
        @keyframes btnShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
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
        .avatar-mini {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .table-row-themed:hover .avatar-mini {
          transform: scale(1.1);
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
      `}</style>

      <div>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="icon-header flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#630ED4] shadow-[0_2px_8px_rgba(124,58,237,0.2)]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1C1B1B]">Students</h1>
              <p className="text-sm text-[#7B7487]">Add and manage student accounts.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add Student Form Card */}
          <div className="lg:col-span-1 h-fit">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white p-6 shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EADDFF]">
                  <svg className="h-4 w-4 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-[#1C1B1B]">Add student</h2>
              </div>

              <FormShell action={createUser} submitLabel="Create student">
                <input type="hidden" name="role" value="student" />
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
                      placeholder="student@school.edu"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Password
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

          {/* Students Table Card */}
          <div className="lg:col-span-2">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              {/* Table Header */}
              <div className="flex items-center justify-between border-b border-[#EDE0FF] px-6 py-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#1C1B1B]">All students</h2>
                  <span className="count-badge inline-flex items-center justify-center rounded-full bg-[#7C3AED] px-2.5 py-0.5 text-[11px] font-bold text-white cursor-default">
                    {students?.length ?? 0}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {!students?.length ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#CCC3D8] bg-[#FDFAFF] py-12">
                    <div className="empty-icon mb-3 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#EADDFF]">
                      <svg className="h-6 w-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-[#1C1B1B]">No students yet</p>
                    <p className="mt-1 text-xs text-[#7B7487]">Create one using the form.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#EDE0FF]">
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Name</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Email</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Class / Section</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Roll</th>
                          <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Status</th>
                          <th className="pb-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#7B7487]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => {
                          const e = enrollmentByStudent[s.id];
                          return (
                            <tr
                              key={s.id}
                              className="table-row-themed group border-b border-[#F6F3F2] last:border-0"
                            >
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="avatar-mini flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#630ED4] text-[11px] font-bold text-white">
                                    {s.full_name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="row-name text-sm font-semibold text-[#1C1B1B] transition-colors">
                                    {s.full_name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 pr-4 text-sm text-[#7B7487]">{s.email}</td>
                              <td className="py-3 pr-4 text-sm">
                                {e ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-[#EADDFF]/40 px-2 py-0.5 text-xs font-semibold text-[#7C3AED]">
                                    {e.class} — {e.section}
                                  </span>
                                ) : (
                                  <span className="text-[#CCC3D8]">—</span>
                                )}
                              </td>
                              <td className="py-3 pr-4 text-sm font-medium text-[#4A4455]">{e?.roll ?? "—"}</td>
                              <td className="py-3 pr-4">
                                {s.is_active ? (
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
                              <td className="py-3">
                                <div className="row-actions flex justify-end gap-2 opacity-50 transition-opacity">
                                  <ToggleButton
                                    action={toggleUserActive}
                                    id={s.id}
                                    active={s.is_active}
                                  />
                                  <DeleteButton action={deleteUser} id={s.id} label="Delete" />
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