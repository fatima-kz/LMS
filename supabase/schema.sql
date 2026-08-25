-- ============================================================================
-- LMS Schema — Multi-tenant (shared DB + RLS), session-based history
-- Run this in: Supabase SQL Editor (Dashboard). Safe to re-run.
-- ============================================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------- Clean drop (order: dependents first) ----------
do $$
begin
  -- policies
  drop policy if exists dde_select on public.daily_diary_entries;
  drop policy if exists dde_student_insert on public.daily_diary_entries;
  drop policy if exists dde_student_update on public.daily_diary_entries;
  drop policy if exists dde_delete on public.daily_diary_entries;
  drop policy if exists ann_select on public.announcements;
  drop policy if exists ann_admin_insert on public.announcements;
  drop policy if exists ann_update on public.announcements;
  drop policy if exists ann_delete on public.announcements;
  drop policy if exists ae_select on public.attendance_entries;
  drop policy if exists ae_teacher_write on public.attendance_entries;
  drop policy if exists ae_teacher_update on public.attendance_entries;
  drop policy if exists ae_teacher_delete on public.attendance_entries;
  drop policy if exists as_select on public.attendance_sessions;
  drop policy if exists as_teacher_write on public.attendance_sessions;
  drop policy if exists as_teacher_update on public.attendance_sessions;
  drop policy if exists as_teacher_delete on public.attendance_sessions;
  drop policy if exists cc_select on public.course_content;
  drop policy if exists cc_teacher_write on public.course_content;
  drop policy if exists cc_teacher_update on public.course_content;
  drop policy if exists cc_teacher_delete on public.course_content;
  drop policy if exists ta_select on public.teaching_assignments;
  drop policy if exists ta_modify on public.teaching_assignments;
  drop policy if exists enrollments_select on public.enrollments;
  drop policy if exists enrollments_modify on public.enrollments;
  drop policy if exists subjects_select on public.subjects;
  drop policy if exists subjects_modify on public.subjects;
  drop policy if exists sections_select on public.sections;
  drop policy if exists sections_modify on public.sections;
  drop policy if exists classes_select on public.classes;
  drop policy if exists classes_modify on public.classes;
  drop policy if exists ay_select on public.academic_years;
  drop policy if exists ay_modify on public.academic_years;
  drop policy if exists profiles_select on public.profiles;
  drop policy if exists profiles_insert on public.profiles;
  drop policy if exists profiles_update on public.profiles;
  drop policy if exists profiles_delete on public.profiles;
  drop policy if exists schools_select on public.schools;
  drop policy if exists schools_update on public.schools;
exception when others then null;
end$$;

drop function if exists public.current_school_id() cascade;
drop function if exists public.current_user_role() cascade;
drop function if exists public.current_year_id() cascade;
drop function if exists public.my_current_section_id() cascade;
drop function if exists public.is_my_ta(uuid, uuid) cascade;
drop function if exists public.author_teaches_student_section(uuid, uuid) cascade;
drop function if exists public.academic_year_id_of(uuid) cascade;
drop function if exists public.section_of_ta(uuid) cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.promote_to_new_year(text, date, date) cascade;

drop table if exists public.daily_diary_entries cascade;
drop table if exists public.announcements cascade;
drop table if exists public.attendance_entries cascade;
drop table if exists public.attendance_sessions cascade;
drop table if exists public.course_content cascade;
drop table if exists public.teaching_assignments cascade;
drop table if exists public.enrollments cascade;
drop table if exists public.subjects cascade;
drop table if exists public.sections cascade;
drop table if exists public.classes cascade;
drop table if exists public.academic_years cascade;
drop table if exists public.profiles cascade;
drop table if exists public.schools cascade;

-- ============================================================================
-- TABLES
-- ============================================================================

create table public.schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique,
  address text,
  phone text,
  email text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  role text not null check (role in ('admin','teacher','student')),
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.profiles (school_id);
create index on public.profiles (role);
create unique index on public.profiles (school_id, email);

create table public.academic_years (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  is_promoted boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.academic_years (school_id);
create unique index on public.academic_years (school_id, name);
create unique index one_current_year_per_school
  on public.academic_years (school_id) where is_current;

create table public.classes (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  level int not null,
  created_at timestamptz not null default now()
);
create index on public.classes (school_id);
create unique index on public.classes (school_id, name);

create table public.sections (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index on public.sections (school_id);
create index on public.sections (class_id);
create unique index on public.sections (class_id, name);

create table public.subjects (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now()
);
create index on public.subjects (school_id);
create unique index on public.subjects (school_id, code);

-- One enrollment per student per academic year (history mechanism).
create table public.enrollments (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  roll_number text,
  status text not null default 'active' check (status in ('active','promoted','graduated','left')),
  created_at timestamptz not null default now()
);
create index on public.enrollments (school_id);
create index on public.enrollments (student_id);
create index on public.enrollments (section_id);
create index on public.enrollments (academic_year_id);
create unique index one_enrollment_per_student_per_year
  on public.enrollments (student_id, academic_year_id);
create unique index enrollment_roll_unique
  on public.enrollments (section_id, academic_year_id, roll_number);

-- Teacher teaches subject to section in a given year.
create table public.teaching_assignments (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index on public.teaching_assignments (school_id);
create index on public.teaching_assignments (teacher_id);
create index on public.teaching_assignments (section_id);
create index on public.teaching_assignments (subject_id);
create index on public.teaching_assignments (academic_year_id);
create unique index ta_unique
  on public.teaching_assignments (teacher_id, subject_id, section_id, academic_year_id);

create table public.course_content (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teaching_assignment_id uuid not null references public.teaching_assignments(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  body text,
  content_date date not null default current_date,
  is_assignment boolean not null default false,
  due_date date,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.course_content (school_id);
create index on public.course_content (teaching_assignment_id);
create index on public.course_content (teacher_id);

create table public.attendance_sessions (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teaching_assignment_id uuid not null references public.teaching_assignments(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  session_date date not null default current_date,
  created_at timestamptz not null default now()
);
create index on public.attendance_sessions (school_id);
create index on public.attendance_sessions (teaching_assignment_id);
create unique index attendance_session_unique
  on public.attendance_sessions (teaching_assignment_id, session_date);

create table public.attendance_entries (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  attendance_session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('present','absent','late','excused')),
  note text,
  created_at timestamptz not null default now()
);
create index on public.attendance_entries (school_id);
create index on public.attendance_entries (attendance_session_id);
create index on public.attendance_entries (student_id);
create unique index attendance_entry_unique
  on public.attendance_entries (attendance_session_id, student_id);

-- Student-owned daily diary / homework log.
create table public.daily_diary_entries (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  entry_date date not null default current_date,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending','completed')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.daily_diary_entries (school_id);
create index on public.daily_diary_entries (student_id);
create index on public.daily_diary_entries (academic_year_id);

create table public.announcements (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  audience text not null check (audience in ('school','section','my_sections')),
  section_id uuid references public.sections(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);
create index on public.announcements (school_id);
create index on public.announcements (section_id);
create index on public.announcements (academic_year_id);
create index on public.announcements (author_id);

-- ============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER — bypass RLS, safe, used in policies)
-- ============================================================================

create or replace function public.current_school_id()
returns uuid language sql stable security definer set search_path = public as $$
  select school_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_year_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.academic_years
  where school_id = public.current_school_id() and is_current;
$$;

create or replace function public.my_current_section_id()
returns uuid language sql stable security definer set search_path = public as $$
  select section_id from public.enrollments
  where student_id = auth.uid() and academic_year_id = public.current_year_id()
  limit 1;
$$;

create or replace function public.is_my_ta(p_section uuid, p_year uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.teaching_assignments
    where teacher_id = auth.uid() and section_id = p_section and academic_year_id = p_year
  );
$$;

create or replace function public.academic_year_id_of(p_ta uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select academic_year_id from public.teaching_assignments where id = p_ta;
$$;

create or replace function public.section_of_ta(p_ta uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select section_id from public.teaching_assignments where id = p_ta;
$$;

create or replace function public.author_teaches_student_section(p_author uuid, p_year uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.teaching_assignments ta
    join public.enrollments e
      on e.section_id = ta.section_id and e.academic_year_id = ta.academic_year_id
    where ta.teacher_id = p_author and ta.academic_year_id = p_year
      and e.student_id = auth.uid()
  );
$$;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger course_content_set_updated_at before update on public.course_content
  for each row execute function public.set_updated_at();
create trigger daily_diary_set_updated_at before update on public.daily_diary_entries
  for each row execute function public.set_updated_at();
create trigger schools_set_updated_at before update on public.schools
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.academic_years enable row level security;
alter table public.classes enable row level security;
alter table public.sections enable row level security;
alter table public.subjects enable row level security;
alter table public.enrollments enable row level security;
alter table public.teaching_assignments enable row level security;
alter table public.course_content enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_entries enable row level security;
alter table public.daily_diary_entries enable row level security;
alter table public.announcements enable row level security;

-- schools
create policy schools_select on public.schools for select
  using (id = public.current_school_id());
create policy schools_update on public.schools for update
  using (id = public.current_school_id() and public.current_user_role() = 'admin');

-- profiles
create policy profiles_select on public.profiles for select
  using (school_id = public.current_school_id());
create policy profiles_insert on public.profiles for insert
  with check (school_id = public.current_school_id() and public.current_user_role() = 'admin');
create policy profiles_update on public.profiles for update
  using (school_id = public.current_school_id() and public.current_user_role() = 'admin');
create policy profiles_delete on public.profiles for delete
  using (school_id = public.current_school_id() and public.current_user_role() = 'admin');

-- academic_years
create policy ay_select on public.academic_years for select
  using (school_id = public.current_school_id());
create policy ay_modify on public.academic_years for all
  using (school_id = public.current_school_id() and public.current_user_role() = 'admin')
  with check (school_id = public.current_school_id() and public.current_user_role() = 'admin');

-- classes
create policy classes_select on public.classes for select
  using (school_id = public.current_school_id());
create policy classes_modify on public.classes for all
  using (school_id = public.current_school_id() and public.current_user_role() = 'admin')
  with check (school_id = public.current_school_id() and public.current_user_role() = 'admin');

-- sections
create policy sections_select on public.sections for select
  using (school_id = public.current_school_id());
create policy sections_modify on public.sections for all
  using (school_id = public.current_school_id() and public.current_user_role() = 'admin')
  with check (school_id = public.current_school_id() and public.current_user_role() = 'admin');

-- subjects
create policy subjects_select on public.subjects for select
  using (school_id = public.current_school_id());
create policy subjects_modify on public.subjects for all
  using (school_id = public.current_school_id() and public.current_user_role() = 'admin')
  with check (school_id = public.current_school_id() and public.current_user_role() = 'admin');

-- enrollments
create policy enrollments_select on public.enrollments for select
  using (
    school_id = public.current_school_id() and (
      public.current_user_role() = 'admin'
      or student_id = auth.uid()
      or (public.current_user_role() = 'teacher'
          and public.is_my_ta(section_id, academic_year_id))
      or (public.current_user_role() = 'student'
          and academic_year_id = public.current_year_id()
          and section_id = public.my_current_section_id())
    )
  );
create policy enrollments_modify on public.enrollments for all
  using (school_id = public.current_school_id() and public.current_user_role() = 'admin')
  with check (school_id = public.current_school_id() and public.current_user_role() = 'admin');

-- teaching_assignments
create policy ta_select on public.teaching_assignments for select
  using (
    school_id = public.current_school_id() and (
      public.current_user_role() = 'admin'
      or teacher_id = auth.uid()
      or (public.current_user_role() = 'student'
          and section_id = public.my_current_section_id()
          and academic_year_id = public.current_year_id())
    )
  );
create policy ta_modify on public.teaching_assignments for all
  using (school_id = public.current_school_id() and public.current_user_role() = 'admin')
  with check (school_id = public.current_school_id() and public.current_user_role() = 'admin');

-- course_content
create policy cc_select on public.course_content for select
  using (
    school_id = public.current_school_id() and (
      public.current_user_role() = 'admin'
      or teacher_id = auth.uid()
      or (public.current_user_role() = 'student'
          and public.academic_year_id_of(teaching_assignment_id) = public.current_year_id()
          and public.section_of_ta(teaching_assignment_id) = public.my_current_section_id())
    )
  );
create policy cc_teacher_write on public.course_content for insert
  with check (
    school_id = public.current_school_id()
    and teacher_id = auth.uid()
    and public.current_user_role() = 'teacher'
    and public.academic_year_id_of(teaching_assignment_id) = public.current_year_id()
  );
create policy cc_teacher_update on public.course_content for update
  using (
    school_id = public.current_school_id() and (
      (teacher_id = auth.uid() and public.current_user_role() = 'teacher'
       and public.academic_year_id_of(teaching_assignment_id) = public.current_year_id())
      or public.current_user_role() = 'admin'
    )
  );
create policy cc_teacher_delete on public.course_content for delete
  using (
    school_id = public.current_school_id() and (
      (teacher_id = auth.uid() and public.current_user_role() = 'teacher'
       and public.academic_year_id_of(teaching_assignment_id) = public.current_year_id())
      or public.current_user_role() = 'admin'
    )
  );

-- attendance_sessions
create policy as_select on public.attendance_sessions for select
  using (
    school_id = public.current_school_id() and (
      public.current_user_role() = 'admin'
      or teacher_id = auth.uid()
      or (public.current_user_role() = 'student'
          and public.section_of_ta(teaching_assignment_id) = public.my_current_section_id()
          and public.academic_year_id_of(teaching_assignment_id) = public.current_year_id())
    )
  );
create policy as_teacher_write on public.attendance_sessions for insert
  with check (
    school_id = public.current_school_id()
    and teacher_id = auth.uid()
    and public.current_user_role() = 'teacher'
    and public.academic_year_id_of(teaching_assignment_id) = public.current_year_id()
  );
create policy as_teacher_update on public.attendance_sessions for update
  using (
    school_id = public.current_school_id() and (
      (teacher_id = auth.uid() and public.current_user_role() = 'teacher'
       and public.academic_year_id_of(teaching_assignment_id) = public.current_year_id())
      or public.current_user_role() = 'admin'
    )
  );
create policy as_teacher_delete on public.attendance_sessions for delete
  using (
    school_id = public.current_school_id() and (
      (teacher_id = auth.uid() and public.current_user_role() = 'teacher'
       and public.academic_year_id_of(teaching_assignment_id) = public.current_year_id())
      or public.current_user_role() = 'admin'
    )
  );

-- attendance_entries
create policy ae_select on public.attendance_entries for select
  using (
    school_id = public.current_school_id() and (
      public.current_user_role() = 'admin'
      or student_id = auth.uid()
      or (public.current_user_role() = 'teacher'
          and exists (select 1 from public.attendance_sessions s
                       where s.id = attendance_session_id and s.teacher_id = auth.uid()))
      or (public.current_user_role() = 'student'
          and exists (
            select 1 from public.attendance_sessions s
            where s.id = attendance_session_id
              and public.section_of_ta(s.teaching_assignment_id) = public.my_current_section_id()
              and public.academic_year_id_of(s.teaching_assignment_id) = public.current_year_id()
          ))
    )
  );
create policy ae_teacher_write on public.attendance_entries for insert
  with check (
    school_id = public.current_school_id()
    and public.current_user_role() = 'teacher'
    and exists (
      select 1 from public.attendance_sessions s
      where s.id = attendance_session_id and s.teacher_id = auth.uid()
        and public.academic_year_id_of(s.teaching_assignment_id) = public.current_year_id()
    )
  );
create policy ae_teacher_update on public.attendance_entries for update
  using (
    school_id = public.current_school_id() and (
      (public.current_user_role() = 'teacher'
       and exists (select 1 from public.attendance_sessions s
                   where s.id = attendance_session_id and s.teacher_id = auth.uid()
                     and public.academic_year_id_of(s.teaching_assignment_id) = public.current_year_id()))
      or public.current_user_role() = 'admin'
    )
  );
create policy ae_teacher_delete on public.attendance_entries for delete
  using (
    school_id = public.current_school_id() and (
      (public.current_user_role() = 'teacher'
       and exists (select 1 from public.attendance_sessions s
                   where s.id = attendance_session_id and s.teacher_id = auth.uid()
                     and public.academic_year_id_of(s.teaching_assignment_id) = public.current_year_id()))
      or public.current_user_role() = 'admin'
    )
  );

-- daily_diary_entries
create policy dde_select on public.daily_diary_entries for select
  using (
    school_id = public.current_school_id() and (
      public.current_user_role() = 'admin'
      or student_id = auth.uid()
      or (public.current_user_role() = 'teacher'
          and exists (
            select 1 from public.enrollments e
            join public.teaching_assignments ta
              on ta.section_id = e.section_id and ta.academic_year_id = e.academic_year_id
            where e.student_id = daily_diary_entries.student_id
              and ta.teacher_id = auth.uid()
              and e.academic_year_id = daily_diary_entries.academic_year_id
          ))
    )
  );
create policy dde_student_insert on public.daily_diary_entries for insert
  with check (
    school_id = public.current_school_id()
    and student_id = auth.uid()
    and public.current_user_role() = 'student'
    and academic_year_id = public.current_year_id()
  );
create policy dde_student_update on public.daily_diary_entries for update
  using (
    school_id = public.current_school_id() and (
      (student_id = auth.uid() and public.current_user_role() = 'student'
       and academic_year_id = public.current_year_id())
      or public.current_user_role() = 'admin'
    )
  );
create policy dde_delete on public.daily_diary_entries for delete
  using (
    school_id = public.current_school_id() and (
      (student_id = auth.uid() and public.current_user_role() = 'student'
       and academic_year_id = public.current_year_id())
      or public.current_user_role() = 'admin'
    )
  );

-- announcements
create policy ann_select on public.announcements for select
  using (
    school_id = public.current_school_id() and (
      public.current_user_role() = 'admin'
      or author_id = auth.uid()
      or audience = 'school'
      or (audience = 'section' and section_id is not null and (
            (public.current_user_role() = 'student'
             and section_id = public.my_current_section_id()
             and academic_year_id = public.current_year_id())
            or (public.current_user_role() = 'teacher'
                and public.is_my_ta(section_id, academic_year_id))
          ))
      or (audience = 'my_sections'
          and public.current_user_role() = 'student'
          and public.author_teaches_student_section(author_id, academic_year_id))
    )
  );
create policy ann_admin_insert on public.announcements for insert
  with check (
    school_id = public.current_school_id()
    and author_id = auth.uid()
    and academic_year_id = public.current_year_id()
    and (
      (public.current_user_role() = 'admin' and audience in ('school','section'))
      or (public.current_user_role() = 'teacher' and audience in ('section','my_sections')
          and (audience = 'my_sections' or public.is_my_ta(section_id, academic_year_id)))
    )
  );
create policy ann_update on public.announcements for update
  using (school_id = public.current_school_id()
         and (author_id = auth.uid() or public.current_user_role() = 'admin'));
create policy ann_delete on public.announcements for delete
  using (school_id = public.current_school_id()
         and (author_id = auth.uid() or public.current_user_role() = 'admin'));

-- ============================================================================
-- YEAR ROLLOVER / PROMOTION  (admin only)
-- Creates next academic year, promotes every active student to the next class
-- level (same section name where available). Graduates the top level.
-- ============================================================================
create or replace function public.promote_to_new_year(
  p_new_name text, p_start_date date, p_end_date date
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_school uuid;
  v_old_year uuid;
  v_new_year uuid;
  v_promoted int := 0;
  v_graduated int := 0;
begin
  if public.current_user_role() is distinct from 'admin' then
    raise exception 'Only admins can run rollover';
  end if;
  v_school := public.current_school_id();

  select id into v_old_year from public.academic_years
    where school_id = v_school and is_current for update;
  if v_old_year is null then
    raise exception 'No current academic year to roll over';
  end if;

  insert into public.academic_years (school_id, name, start_date, end_date, is_current)
  values (v_school, p_new_name, p_start_date, p_end_date, true)
  returning id into v_new_year;

  update public.academic_years
    set is_current = false, is_promoted = true
    where id = v_old_year;

  -- Build the promotion plan per active student
  create temp table _plan on commit drop as
    select e.student_id,
      e.section_id as old_section,
      s.name as section_name,
      c.level as old_level,
      coalesce(
        (select sc.id from public.sections sc
          join public.classes cl on cl.id = sc.class_id
          where sc.school_id = v_school and cl.level = c.level + 1 and sc.name = s.name
          limit 1),
        (select sc.id from public.sections sc
          join public.classes cl on cl.id = sc.class_id
          where sc.school_id = v_school and cl.level = c.level + 1
          order by sc.name limit 1)
      ) as new_section
    from public.enrollments e
    join public.sections s on s.id = e.section_id
    join public.classes c on c.id = s.class_id
    where e.academic_year_id = v_old_year and e.status = 'active';

  -- Promote those with a target section; assign sequential roll numbers per new section.
  with numbered as (
    select student_id, new_section,
      row_number() over (partition by new_section order by student_id) as rn
    from _plan where new_section is not null
  )
  insert into public.enrollments
    (school_id, student_id, section_id, academic_year_id, roll_number, status)
  select v_school, student_id, new_section, v_new_year, rn::text, 'active'
  from numbered;
  get diagnostics v_promoted = row_count;

  -- Graduates: active students whose class has no next level.
  update public.enrollments e set status = 'graduated'
    where e.academic_year_id = v_old_year and e.status = 'active'
      and not exists (
        select 1 from public.sections sc
        join public.classes cl on cl.id = sc.class_id
        where sc.school_id = v_school
          and cl.level = (select c.level from public.sections s
                            join public.classes c on c.id = s.class_id
                            where s.id = e.section_id) + 1
      );
  get diagnostics v_graduated = row_count;

  -- Remaining active (had next level but somehow no section found) -> mark promoted
  update public.enrollments set status = 'promoted'
    where academic_year_id = v_old_year and status = 'active';

  return jsonb_build_object(
    'new_year_id', v_new_year, 'promoted', v_promoted, 'graduated', v_graduated
  );
end;
$$;

-- Done.
