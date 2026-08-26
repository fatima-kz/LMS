import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { 
  GraduationCap, 
  Users, 
  Layers, 
  LayoutGrid, 
  BookOpen, 
  Sparkles, 
  Megaphone, 
  History, 
  Calendar,
  ArrowRight,
  Clock
} from "lucide-react";

export default async function AdminOverview() {
  const supabase = await createClient();
  const year = await supabase
    .from("academic_years")
    .select("*")
    .eq("is_current", true)
    .single();

  const count = async (table: string) =>
    (await supabase.from(table).select("*", { count: "exact", head: true })).count ?? 0;

  const { count: studentCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");
  const { count: teacherCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "teacher");

  const [classes, sections, subjects, announcements, enrollments] =
    await Promise.all([
      count("classes"),
      count("sections"),
      count("subjects"),
      count("announcements"),
      year.data ? count("enrollments") : Promise.resolve(0),
    ]);

  const { data: recent } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, audience, author_id")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    {
      label: "Students",
      value: studentCount ?? 0,
      icon: GraduationCap,
      textColor: "text-[#7C3AED]",
      bgLight: "bg-[#EDE0FF]/60",
      borderStripe: "border-t-[#7C3AED]",
    },
    {
      label: "Teachers",
      value: teacherCount ?? 0,
      icon: Users,
      textColor: "text-[#705D00]",
      bgLight: "bg-[#FFF9DE]",
      borderStripe: "border-t-[#FFD600]",
    },
    {
      label: "Classes",
      value: classes,
      icon: Layers,
      textColor: "text-[#FF4D6D]",
      bgLight: "bg-[#FFEDF1]",
      borderStripe: "border-t-[#FF4D6D]",
    },
    {
      label: "Sections",
      value: sections,
      icon: LayoutGrid,
      textColor: "text-[#7C3AED]",
      bgLight: "bg-[#EDE0FF]/60",
      borderStripe: "border-t-[#7C3AED]",
    },
    {
      label: "Subjects",
      value: subjects,
      icon: BookOpen,
      textColor: "text-[#FF4D6D]",
      bgLight: "bg-[#FFEDF1]",
      borderStripe: "border-t-[#FF4D6D]",
    },
    {
      label: "Active Enrollments",
      value: enrollments,
      hint: "current session",
      icon: Sparkles,
      textColor: "text-[#705D00]",
      bgLight: "bg-[#FFF9DE]",
      borderStripe: "border-t-[#FFD600]",
    },
    {
      label: "Announcements",
      value: announcements,
      icon: Megaphone,
      textColor: "text-[#7C3AED]",
      bgLight: "bg-[#EDE0FF]/60",
      borderStripe: "border-t-[#7C3AED]",
    },
    {
      label: "Past Sessions",
      value: 0,
      hint: "history",
      icon: History,
      textColor: "text-[#7b7487]",
      bgLight: "bg-[#F0EDED]",
      borderStripe: "border-t-[#7b7487]",
    },
  ];

  return (
    <div className="space-y-8 font-sans selection:bg-[#EADDFF] selection:text-[#25005A]">
      
      {/* Top Page Header Banner */}
      <div className="flex flex-col gap-4 rounded-[24px] border border-[#ECE6F0] bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 shadow-[0_10px_30px_rgba(124,58,237,0.04)]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1c1b1b]">
            Admin Overview
          </h1>
          <p className="text-sm font-medium text-[#4a4455]">
            {year.data
              ? `Current session: ${year.data.name}`
              : "No current academic year set"}
          </p>
        </div>

        {/* Academic Session Pill */}
        <div>
          <Link href="/dashboard/admin/years">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-transform hover:scale-105 ${
                year.data
                  ? "border border-[#FFE170] bg-[#FFD600] text-[#1c1b1b] shadow-sm shadow-[#FFD600]/20"
                  : "border border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{year.data ? year.data.name : "No active session"}</span>
            </span>
          </Link>
        </div>
      </div>

      {/* 8 Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className={`relative overflow-hidden rounded-[20px] border border-[#ECE6F0] border-t-4 ${stat.borderStripe} bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(124,58,237,0.08)]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7b7487]">
                  {stat.label}
                </span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bgLight} ${stat.textColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-[#1c1b1b]">
                  {stat.value}
                </span>
                {stat.hint && (
                  <span className="rounded-full bg-[#F6F3F2] px-2.5 py-0.5 text-[10px] font-bold text-[#7b7487] capitalize">
                    {stat.hint}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Announcements Section (Fixed & Redesigned) */}
      <div className="rounded-[24px] border border-[#ECE6F0] bg-white p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        
        {/* Section Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#ECE6F0]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/25">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#1c1b1b]">
                Recent Announcements
              </h2>
              <p className="text-xs text-[#7b7487]">
                Broadcasts across school and sections
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/admin/announcements"
            className="group inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:underline"
          >
            <span>View all</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Announcements List */}
        <div className="mt-6 space-y-3.5">
          {!recent?.length && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6F3F2] text-[#7b7487]">
                <Clock className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#1c1b1b]">No announcements yet</p>
              <p className="text-xs text-[#7b7487]">Create your first announcement to notify teachers and students.</p>
            </div>
          )}

          {recent?.map((a) => {
            const isSchoolAudience = a.audience === "school";
            return (
              <div
                key={a.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#ECE6F0] bg-[#FDF9F8] p-4.5 sm:p-5 transition-all hover:bg-white hover:border-[#7C3AED]/40 hover:shadow-md"
              >
                {/* Left: Icon + Title + Body */}
                <div className="flex items-start sm:items-center gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      isSchoolAudience
                        ? "bg-[#EDE0FF] text-[#630ED4]"
                        : "bg-[#FFF9DE] text-[#705D00]"
                    }`}
                  >
                    <Megaphone className="h-5 w-5" />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#1c1b1b] group-hover:text-[#7C3AED] transition-colors">
                      {a.title}
                    </p>
                    {a.body && (
                      <p className="text-xs text-[#4a4455] line-clamp-1 leading-relaxed">
                        {a.body}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7b7487]">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(a.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Saturated Tag */}
                <div className="self-end sm:self-center shrink-0">
                  <span
                    className={`inline-block rounded-full px-3.5 py-1 text-[11px] font-black uppercase tracking-wider ${
                      isSchoolAudience
                        ? "bg-[#EDE0FF] text-[#630ED4] border border-[#7C3AED]/20"
                        : "bg-[#FFF9DE] text-[#705D00] border border-[#FFD600]/40"
                    }`}
                  >
                    {a.audience}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}