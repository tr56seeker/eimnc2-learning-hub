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
  lrn: string | null;
  loginId: string | null;
  gradeLevel: string | number | null;
  sectionId: string | null;
  sectionName: string;
  status: "active" | "inactive" | null;
  mustChangePassword: boolean;
};
