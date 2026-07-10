import type { ProfileStatus } from "@/lib/types";

export type SectionOption = {
  id: string;
  name: string;
  grade_level: string | number;
  school_year: string;
  is_active: boolean | null;
};

export type LearnerListItem = {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  middleInitial: string | null;
  middleName: string | null;
  suffix: string | null;
  sex: string | null;
  birthdate: string | null;
  lastSeenAt: string | null;
  lrn: string | null;
  loginId: string | null;
  gradeLevel: string | number | null;
  sectionId: string | null;
  sectionName: string;
  status: ProfileStatus | null;
  mustChangePassword: boolean;
};
