"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

export type NavItem = { label: string; href: string; icon: string };

const icons: Record<string, string> = {
  overview: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  users: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2a4 4 0 11-8 0 4 4 0 018 0z",
  teacher: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
  book: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  megaphone: "M11 5.882V19.5a2.5 2.5 0 11-5 0v-9.221m5 9.221a2.5 2.5 0 11-5 0V5.882M11 5.882L19.5 9v7L11 12.118",
  history: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  assignment: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2",
  diary: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2v-5M13 3h6a2 2 0 012 2v6a2 2 0 01-2 2h-6a2 2 0 01-2-2V5a2 2 0 012-2z",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
};

function Icon({ name }: { name: string }) {
  const d = icons[name] ?? icons.overview;
  return (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

export function Sidebar({
  items,
  role,
  schoolName,
  userName,
}: {
  items: NavItem[];
  role: Role;
  schoolName: string;
  userName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-[#ECE6F0] bg-white font-sans">
      
      {/* Top Section: School Branding + Nav Links */}
      <div className="flex flex-col overflow-y-auto px-4 py-6">
        
        {/* School Logo Header */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED] text-base font-black text-white shadow-sm shadow-[#7C3AED]/30">
            {schoolName.charAt(0) ?? "L"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-[#1c1b1b]">
              {schoolName}
            </p>
            <p className="text-[11px] font-semibold text-[#7b7487] capitalize">
              {role} portal
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {items.map((item) => {
            // Fix: Overview only highlights on exact match, other pages can match sub-routes
            const isOverview = item.href === `/dashboard/${role}`;
            const active = isOverview
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all",
                  active
                    ? "bg-[#7C3AED] text-white shadow-sm shadow-[#7C3AED]/25"
                    : "text-[#4a4455] hover:bg-[#F6F3F2] hover:text-[#1c1b1b]"
                )}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Profile + Sign Out Button */}
      <div className="border-t border-[#ECE6F0] p-4 bg-[#FDFAFF]/60">
        {/* User Profile Info */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDE0FF] text-xs font-extrabold text-[#630ED4] ring-2 ring-white shadow-sm">
            {userName.charAt(0) ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-extrabold text-[#1c1b1b]">
              {userName}
            </p>
            <p className="text-[11px] font-medium capitalize text-[#7b7487]">
              {role}
            </p>
          </div>
        </div>

        {/* Sign Out Button */}
        <form action={logout} className="mt-2.5">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 text-xs font-bold text-[#4a4455] transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
          >
            <Icon name="logout" />
            <span>Sign out</span>
          </button>
        </form>
      </div>

    </aside>
  );
}