export type UserRole = "learner" | "teacher" | "admin";
export type ProfileStatus = "active" | "inactive" | "deleted";

export type Profile = {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  middle_initial: string | null;
  middle_name: string | null;
  suffix: string | null;
  sex: string | null;
  birthdate: string | null;
  last_seen_at: string | null;
  role: UserRole;
  email: string | null;
  lrn: string | null;
  section_id: string | null;
  grade_level: string | number | null;
  status: ProfileStatus | null;
  must_change_password: boolean;
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
