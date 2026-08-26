import { createClient } from "@/lib/supabase/server";
import { FormShell } from "@/components/form-shell";
import { createAnnouncementAdmin, deleteAnnouncement } from "../actions";
import { DeleteButton } from "../_controls";
import { formatDate } from "@/lib/utils";

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();
  const [sections, announcements] = await Promise.all([
    supabase.from("sections").select("id, name, class:classes(name)").order("name"),
    supabase
      .from("announcements")
      .select("id, title, body, audience, section_id, created_at, author:profiles(full_name)")
      .order("created_at", { ascending: false }),
  ]);

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
        .announcement-row {
          transition: all 0.2s ease;
        }
        .announcement-row:hover {
          background: rgba(234,221,255,0.15);
          border-color: #CCC3D8;
        }
        .announcement-row:hover .row-title {
          color: #7C3AED;
        }
        .announcement-row:hover .row-delete {
          opacity: 1;
        }
        .announcement-icon {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .announcement-row:hover .announcement-icon {
          transform: scale(1.1) rotate(-5deg);
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
      `}</style>

      <div>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="icon-header flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#630ED4] shadow-[0_2px_8px_rgba(124,58,237,0.2)]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.5a2.5 2.5 0 11-5 0v-9.221m5 9.221a2.5 2.5 0 11-5 0V5.882M11 5.882L19.5 9v7L11 12.118" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1C1B1B]">Announcements</h1>
              <p className="text-sm text-[#7B7487]">Send announcements to the whole school or a specific section.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* New Announcement Form */}
          <div className="lg:col-span-1 h-fit">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white p-6 shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EADDFF]">
                  <svg className="h-4 w-4 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-[#1C1B1B]">New announcement</h2>
              </div>

              <FormShell action={createAnnouncementAdmin} submitLabel="Send">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Title
                    </label>
                    <input
                      id="title"
                      name="title"
                      required
                      className="input-themed block w-full rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] placeholder-[#7B7487] outline-none"
                      placeholder="Announcement title"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="body" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Message
                    </label>
                    <textarea
                      id="body"
                      name="body"
                      rows={4}
                      className="input-themed block w-full resize-none rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 text-sm text-[#1C1B1B] placeholder-[#7B7487] outline-none"
                      placeholder="Write your message…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="audience" className="block text-xs font-bold uppercase tracking-wide text-[#4A4455]">
                      Audience
                    </label>
                    <div className="select-wrapper relative">
                      <select
                        id="audience"
                        name="audience"
                        required
                        className="input-themed block w-full appearance-none rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 pr-10 text-sm text-[#1C1B1B] outline-none"
                      >
                        <option value="school">Whole school</option>
                        <option value="section">Specific section</option>
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
                      Section <span className="font-normal normal-case text-[#7B7487]">(if specific)</span>
                    </label>
                    <div className="select-wrapper relative">
                      <select
                        id="section_id"
                        name="section_id"
                        className="input-themed block w-full appearance-none rounded-lg border-2 border-transparent bg-[#F6F3F2] px-3 py-2.5 pr-10 text-sm text-[#1C1B1B] outline-none"
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
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="select-chevron h-4 w-4 text-[#7B7487]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </FormShell>
            </div>
          </div>

          {/* Announcements List */}
          <div className="lg:col-span-2">
            <div className="card-themed rounded-xl border border-[#EDE0FF] bg-white shadow-[0_4px_12px_rgba(124,58,237,0.06)]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#EDE0FF] px-6 py-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#1C1B1B]">All announcements</h2>
                  <span className="count-badge inline-flex cursor-default items-center justify-center rounded-full bg-[#7C3AED] px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {announcements.data?.length ?? 0}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {!announcements.data?.length ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#CCC3D8] bg-[#FDFAFF] py-12">
                    <div className="empty-icon mb-3 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#EADDFF]">
                      <svg className="h-6 w-6 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.5a2.5 2.5 0 11-5 0v-9.221m5 9.221a2.5 2.5 0 11-5 0V5.882M11 5.882L19.5 9v7L11 12.118" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-[#1C1B1B]">No announcements yet</p>
                    <p className="mt-1 text-xs text-[#7B7487]">Create one using the form.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.data.map((a) => {
                      const author = a.author as unknown as { full_name: string } | null;
                      const isSchoolWide = a.audience === "school";
                      return (
                        <div
                          key={a.id}
                          className="announcement-row group rounded-xl border border-[#EDE0FF] p-4"
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div
                              className={`announcement-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                isSchoolWide ? "bg-gradient-to-br from-[#7C3AED] to-[#630ED4]" : "bg-[#FFD600]/15"
                              }`}
                            >
                              <svg
                                className={`h-5 w-5 ${isSchoolWide ? "text-white" : "text-[#6F5C00]"}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.5a2.5 2.5 0 11-5 0v-9.221m5 9.221a2.5 2.5 0 11-5 0V5.882M11 5.882L19.5 9v7L11 12.118" />
                              </svg>
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="row-title truncate text-sm font-bold text-[#1C1B1B] transition-colors">
                                    {a.title}
                                  </p>
                                  {a.body && (
                                    <p className="mt-0.5 line-clamp-1 text-xs text-[#7B7487]">{a.body}</p>
                                  )}
                                </div>
                                <div className="row-delete shrink-0 opacity-50 transition-opacity">
                                  <DeleteButton action={deleteAnnouncement} id={a.id} />
                                </div>
                              </div>

                              {/* Meta row */}
                              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                    isSchoolWide
                                      ? "bg-[#EADDFF] text-[#7C3AED]"
                                      : "bg-[#FFD600]/15 text-[#6F5C00]"
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      isSchoolWide ? "bg-[#7C3AED]" : "bg-[#6F5C00]"
                                    }`}
                                  />
                                  {a.audience}
                                </span>
                                <span className="text-[11px] text-[#CCC3D8]">•</span>
                                <span className="text-[11px] font-medium text-[#7B7487]">
                                  {author?.full_name ?? "Unknown"}
                                </span>
                                <span className="text-[11px] text-[#CCC3D8]">•</span>
                                <span className="text-[11px] font-medium text-[#7B7487]">
                                  {formatDate(a.created_at)}
                                </span>
                              </div>
                            </div>
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