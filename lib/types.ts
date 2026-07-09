export type UserRole = "learner" | "teacher" | "admin";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  email: string | null;
  lrn: string | null;
  section_id: string | null;
  grade_level: number | null;
  status: "active" | "inactive" | null;
};

export type Lesson = {
  id: string;
  title: string;
  summary: string | null;
  content_md: string | null;
  estimated_minutes: number | null;
};

export type QuestionType = "multiple_choice" | "true_false" | "identification" | "essay";

export type QuestionChoice = {
  label: string;
  value: string;
};
