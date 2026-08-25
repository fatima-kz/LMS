export type Role = "admin" | "teacher" | "student";

export type Profile = {
  id: string;
  school_id: string;
  role: Role;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type School = {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type AcademicYear = {
  id: string;
  school_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  is_promoted: boolean;
  created_at: string;
};

export type Class = {
  id: string;
  school_id: string;
  name: string;
  level: number;
  created_at: string;
};

export type Section = {
  id: string;
  school_id: string;
  class_id: string;
  name: string;
  created_at: string;
};

export type Subject = {
  id: string;
  school_id: string;
  name: string;
  code: string | null;
  created_at: string;
};

export type Enrollment = {
  id: string;
  school_id: string;
  student_id: string;
  section_id: string;
  academic_year_id: string;
  roll_number: string | null;
  status: "active" | "promoted" | "graduated" | "left";
  created_at: string;
};

export type TeachingAssignment = {
  id: string;
  school_id: string;
  teacher_id: string;
  subject_id: string;
  section_id: string;
  academic_year_id: string;
  created_at: string;
};

export type CourseContent = {
  id: string;
  school_id: string;
  teaching_assignment_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  body: string | null;
  content_date: string;
  is_assignment: boolean;
  due_date: string | null;
  attachments: unknown;
  created_at: string;
  updated_at: string;
};

export type AttendanceSession = {
  id: string;
  school_id: string;
  teaching_assignment_id: string;
  teacher_id: string;
  session_date: string;
  created_at: string;
};

export type AttendanceEntry = {
  id: string;
  school_id: string;
  attendance_session_id: string;
  student_id: string;
  status: "present" | "absent" | "late" | "excused";
  note: string | null;
  created_at: string;
};

export type DailyDiaryEntry = {
  id: string;
  school_id: string;
  student_id: string;
  academic_year_id: string;
  subject_id: string | null;
  entry_date: string;
  title: string;
  description: string | null;
  status: "pending" | "completed";
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Announcement = {
  id: string;
  school_id: string;
  author_id: string;
  audience: "school" | "section" | "my_sections";
  section_id: string | null;
  academic_year_id: string;
  title: string;
  body: string | null;
  created_at: string;
};
