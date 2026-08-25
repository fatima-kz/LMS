-- ============================================================================
-- Migration: Make subjects class-specific
-- Run this in Supabase SQL Editor (after the main schema.sql)
-- Adds class_id to subjects so each class has its own set of subjects.
-- ============================================================================

-- 1. Add class_id column (nullable first for safety)
alter table public.subjects add column if not exists class_id uuid references public.classes(id) on delete cascade;

-- 2. Backfill: assign any orphan subjects to the first class in the school
update public.subjects s
  set class_id = (select c.id from public.classes c
                  where c.school_id = s.school_id
                  order by c.level limit 1)
  where s.class_id is null;

-- 3. Make class_id NOT NULL (now that all rows are backfilled)
alter table public.subjects alter column class_id set not null;

-- 4. Replace unique constraint: same subject name allowed across classes,
--    but unique per (school, class, name)
drop index if exists public.subjects_school_id_code_key;
drop index if exists public.subjects_school_id_class_id_name_key;
create unique index subjects_unique_per_class
  on public.subjects (school_id, class_id, name);

-- 5. Add index for class_id lookups
create index if not exists on public.subjects (class_id);

-- Done. Each class now has its own subjects, and teaching_assignments
-- (teacher + subject + section + year) naturally ties a teacher to a
-- specific class's subject for a specific section.
