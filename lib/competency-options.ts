import {
  EIM_COMPETENCY_MAP,
  findCompetencyByCode,
  formatCompetencyLabel,
  formatCompetencyShortLabel,
  formatCompetencyGroupLabel,
  groupCompetenciesByGradeTermCluster,
  sortCompetenciesByOrder,
  type EimCompetency
} from "./eim-competency-map";

export type CompetencyOption = {
  id: string;
  value: string;
  code: string;
  label: string;
  gradeLevel: number | null;
  term: number | null;
  cluster: string;
  unitCode: string;
  competencyTitle: string;
  weekNumber: number | null;
  topicTitle: string;
  description: string;
  suggestedLessonTitle: string;
  suggestedObjectives: string[];
  suggestedActivities: string[];
  suggestedAssessment: string[];
  orderIndex: number | null;
};

function toCompetencyOption(competency: Partial<EimCompetency>): CompetencyOption {
  return {
    id: competency.code?.trim() || "",
    value: competency.code?.trim() || "",
    code: competency.code?.trim() || "",
    label: formatCompetencyLabel(competency),
    gradeLevel: competency.gradeLevel ?? null,
    term: competency.term ?? null,
    cluster: competency.cluster?.trim() || "General",
    unitCode: competency.unitCode?.trim() || "",
    competencyTitle: competency.competencyTitle?.trim() || competency.topicTitle?.trim() || "",
    weekNumber: competency.weekNumber ?? null,
    topicTitle: competency.topicTitle?.trim() || "",
    description: competency.description?.trim() || "",
    suggestedLessonTitle: competency.suggestedLessonTitle?.trim() || "",
    suggestedObjectives: competency.suggestedObjectives ?? [],
    suggestedActivities: competency.suggestedActivities ?? [],
    suggestedAssessment: competency.suggestedAssessment ?? [],
    orderIndex: competency.orderIndex ?? null
  };
}

export function getCompetencyOptions({ gradeLevel, term }: { gradeLevel?: number | null; term?: number | null } = {}): CompetencyOption[] {
  return sortCompetenciesByOrder(
    EIM_COMPETENCY_MAP.filter((competency) => {
      const matchesGrade = gradeLevel == null || competency.gradeLevel == null || competency.gradeLevel === gradeLevel;
      const matchesTerm = term == null || competency.term == null || competency.term === term;
      return matchesGrade && matchesTerm;
    })
  ).map((competency) => toCompetencyOption(competency));
}

export function getCompetencyOptionByCode(code: string | null | undefined): CompetencyOption | undefined {
  const competency = findCompetencyByCode(EIM_COMPETENCY_MAP, code);
  return competency ? toCompetencyOption(competency) : undefined;
}

export {
  EIM_COMPETENCY_MAP,
  findCompetencyByCode,
  formatCompetencyLabel,
  formatCompetencyShortLabel,
  formatCompetencyGroupLabel,
  groupCompetenciesByGradeTermCluster,
  sortCompetenciesByOrder,
  type CompetencyGroup,
  type EimCompetency
} from "./eim-competency-map";
