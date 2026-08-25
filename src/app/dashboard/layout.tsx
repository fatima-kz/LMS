import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentSchool } from "@/lib/data";
import { Sidebar, type NavItem } from "@/components/dashboard/sidebar";
import { logout } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/types";

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { label: "Overview", href: "/dashboard/admin", icon: "overview" },
    { label: "Students", href: "/dashboard/admin/students", icon: "users" },
    { label: "Teachers", href: "/dashboard/admin/teachers", icon: "teacher" },
    { label: "Classes", href: "/dashboard/admin/classes", icon: "book" },
    { label: "Subjects", href: "/dashboard/admin/subjects", icon: "book" },
    { label: "Academic Years", href: "/dashboard/admin/years", icon: "calendar" },
    { label: "Enrollments", href: "/dashboard/admin/enrollments", icon: "users" },
    { label: "Teaching Assignments", href: "/dashboard/admin/assignments", icon: "assignment" },
    { label: "Announcements", href: "/dashboard/admin/announcements", icon: "megaphone" },
    { label: "Past Sessions", href: "/dashboard/admin/history", icon: "history" },
  ],
  teacher: [
    { label: "Overview", href: "/dashboard/teacher", icon: "overview" },
    { label: "My Classes", href: "/dashboard/teacher/classes", icon: "book" },
    { label: "Course Content", href: "/dashboard/teacher/content", icon: "book" },
    { label: "Attendance", href: "/dashboard/teacher/attendance", icon: "clipboard" },
    { label: "Announcements", href: "/dashboard/teacher/announcements", icon: "megaphone" },
  ],
  student: [
    { label: "Overview", href: "/dashboard/student", icon: "overview" },
    { label: "Daily Diary", href: "/dashboard/student/diary", icon: "diary" },
    { label: "Courses", href: "/dashboard/student/courses", icon: "book" },
    { label: "Attendance", href: "/dashboard/student/attendance", icon: "clipboard" },
    { label: "Announcements", href: "/dashboard/student/announcements", icon: "megaphone" },
    { label: "Classmates", href: "/dashboard/student/classmates", icon: "users" },
  ],
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const school = await getCurrentSchool();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        items={NAV[profile.role]}
        role={profile.role}
        schoolName={school?.name ?? "LMS"}
        userName={profile.full_name}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-card px-6">
          <p className="text-sm text-muted-foreground">
            {school?.name ?? "LMS"}
          </p>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
