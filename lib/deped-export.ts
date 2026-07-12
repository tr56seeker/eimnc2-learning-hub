import type { EditableGradebookAssessment } from "@/lib/gradebook";

// Static school/subject info — this app currently serves a single school/subject
// (EIM NC II at Tabunoc NHS). Adjust here if that ever changes.
export const DEPED_SCHOOL_INFO = {
  region: "Region VII",
  division: "Talisay City",
  schoolId: "303111",
  schoolName: "TABUNOC NATIONAL HIGH SCHOOL"
};

export const DEPED_SUBJECT_INFO = {
  track: "TECHNICAL PROFESSIONAL",
  subjectType: "TechPro Elective (All Other Electives)",
  subject: "Electrical Installation Maintenance"
};

export type DepedLearner = {
  id: string;
  fullName: string;
  sex: "Male" | "Female" | null;
};

export type DepedTermScores = {
  written: (number | null)[];
  performance: (number | null)[];
  sa1: number | null;
  sa2: number | null;
  te: number | null;
};

export type DepedTermData = {
  writtenHPS: (number | null)[];
  performanceHPS: (number | null)[];
  sa1HPS: number | null;
  sa2HPS: number | null;
  teHPS: number | null;
  scoresByLearner: Record<string, DepedTermScores>;
};

export type DepedExportPayload = {
  schoolYear: string;
  gradeLevel: string | number;
  section: string;
  teacherName: string;
  learners: DepedLearner[];
  terms: {
    "First Term": DepedTermData;
    "Second Term": DepedTermData;
    "Third Term": DepedTermData;
  };
};

function pickByLabel(assessments: EditableGradebookAssessment[], category: string, labels: string[]) {
  return labels.map((label) => assessments.find((a) => a.category === category && a.label === label) ?? null);
}

export function buildDepedTermData(
  assessments: EditableGradebookAssessment[],
  learners: DepedLearner[],
  scoreMap: Map<string, number | null>
): DepedTermData {
  const written = pickByLabel(assessments, "written", ["1", "2", "3", "4", "5"]);
  const performance = pickByLabel(assessments, "performance", ["1", "2", "3"]);
  const [sa1] = pickByLabel(assessments, "summative", ["SA1"]);
  const [sa2] = pickByLabel(assessments, "summative", ["SA2"]);
  const [te] = pickByLabel(assessments, "term_exam", ["TE"]);

  const scoresByLearner: Record<string, DepedTermScores> = {};
  for (const learner of learners) {
    scoresByLearner[learner.id] = {
      written: written.map((a) => (a ? scoreMap.get(`${a.id}:${learner.id}`) ?? null : null)),
      performance: performance.map((a) => (a ? scoreMap.get(`${a.id}:${learner.id}`) ?? null : null)),
      sa1: sa1 ? scoreMap.get(`${sa1.id}:${learner.id}`) ?? null : null,
      sa2: sa2 ? scoreMap.get(`${sa2.id}:${learner.id}`) ?? null : null,
      te: te ? scoreMap.get(`${te.id}:${learner.id}`) ?? null : null
    };
  }

  return {
    writtenHPS: written.map((a) => a?.highestPossible ?? null),
    performanceHPS: performance.map((a) => a?.highestPossible ?? null),
    sa1HPS: sa1?.highestPossible ?? null,
    sa2HPS: sa2?.highestPossible ?? null,
    teHPS: te?.highestPossible ?? null,
    scoresByLearner
  };
}
