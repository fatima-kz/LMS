# LMS

A general-purpose, multi-tenant Learning Management System for schools. Built to be sold to and configured by any school. Each school gets an isolated workspace via Supabase Row-Level Security (RLS) on a shared database.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Supabase** (Postgres, Auth, RLS, Storage)
- **Tailwind CSS** + hand-rolled UI primitives

## Features

### Multi-tenancy
- Shared database, row-level security isolates every school.
- Any school can register and self-onboard their admin.

### Roles
- **Admin** — full control: students, teachers, classes, sections, subjects, academic years, enrollments, teaching assignments, announcements, year rollover, and past-session history.
- **Teacher** — manage their assigned classes/subjects, publish course content (lessons + assignments), take attendance, send announcements to a section or all their sections.
- **Student** — view courses and attendance (read-only), maintain a personal daily diary/homework log, view announcements, and see classmates.

### Sessions & History
- 1 session = 1 academic year. All records are scoped to an `academic_year_id`.
- Teachers and students only see the **current** session.
- Admins get a **Past Sessions** area (read + edit) so old records are preserved but never confused with the new session.
- **Year rollover** auto-creates the next session, promotes every active student to the next class level (same section name where available), and graduates the top level. Admins can override placements.

### Placement model
- Student → Section → Class. A student is enrolled in exactly one section per session.
- A teacher can teach multiple subjects across multiple sections.

## Getting started

### 1. Supabase setup
Create a Supabase project, then run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor. It creates all tables, RLS policies, helper functions, and the year-rollover RPC. Safe to re-run.

### 2. Environment
Copy `.env.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Install & run
```bash
npm install
npm run dev
```
Open http://localhost:3000 → **Register your school** to create the first admin account and seed the first academic year.

## Scripts
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check

## Project structure
```
src/
  app/
    login/ register-school/        Auth pages
    dashboard/
      admin/                       Admin portal (students, teachers, classes, sections, subjects, years, enrollments, assignments, announcements, history)
      teacher/                     Teacher portal (classes, content, attendance, announcements)
      student/                     Student portal (diary, courses, attendance, announcements, classmates)
  components/ui/                   UI primitives (Button, Card, Input, Table, Badge, ...)
  lib/
    supabase/                      browser / server / admin (service-role) clients
    data.ts                        server-side profile/school/year helpers
    types.ts                       DB row types
supabase/schema.sql                Full schema + RLS + functions
```
