export type EimCompetency = {
  code: string;
  gradeLevel: number | null;
  term: number | null;
  cluster: string;
  unitCode: string;
  competencyTitle: string;
  weekNumber: number | null;
  topicTitle: string;
  suggestedLessonTitle: string;
  suggestedObjectives: string[];
  suggestedActivities: string[];
  suggestedAssessment: string[];
  orderIndex: number | null;
  description?: string;
};

export type CompetencyLike = Partial<EimCompetency> & {
  grade_level?: number | string | null;
  order_index?: number | string | null;
};

export type CompetencyGroup = {
  gradeLevel: number | null;
  term: number | null;
  cluster: string;
  competencies: CompetencyLike[];
};

export const EIM_COMPETENCY_MAP: EimCompetency[] = [
  {
    code: "EIM11-OHS",
    gradeLevel: 11,
    term: 1,
    cluster: "Safety and Workplace Practices",
    unitCode: "U1",
    competencyTitle: "Observe Occupational Health and Safety",
    weekNumber: 1,
    topicTitle: "Occupational Health and Safety",
    suggestedLessonTitle: "Introduction to Electrical Safety and PPE",
    suggestedObjectives: [
      "Identify common electrical hazards and risks.",
      "Demonstrate correct PPE selection and use.",
      "Explain basic workplace safety rules before starting a task.",
    ],
    suggestedActivities: [
      "Classroom hazard identification walk-through.",
      "PPE matching activity and safety demonstration.",
    ],
    suggestedAssessment: [
      "Short safety quiz with PPE and hazard scenarios.",
      "Teacher observation checklist during practical work.",
    ],
    orderIndex: 1,
    description: "Safety rules, hazards, PPE, and basic workplace protocols in EIM.",
  },
  {
    code: "EIM11-TM",
    gradeLevel: 11,
    term: 1,
    cluster: "Tools and Materials",
    unitCode: "U2",
    competencyTitle: "Prepare Electrical Tools and Materials",
    weekNumber: 2,
    topicTitle: "Electrical Tools and Materials",
    suggestedLessonTitle: "Identifying Electrical Tools and Materials",
    suggestedObjectives: [
      "Identify common tools and electrical materials used in EIM.",
      "Explain the safe use of selected electrical tools.",
      "Maintain tools and materials properly after use.",
    ],
    suggestedActivities: [
      "Tool and material identification sorting activity.",
      "Safe handling demonstration for hand tools.",
    ],
    suggestedAssessment: [
      "Tool identification written test.",
      "Practical performance task: safe tool handling.",
    ],
    orderIndex: 2,
    description: "Identification, proper use, and maintenance of electrical tools and materials.",
  },
  {
    code: "EIM11-MC",
    gradeLevel: 11,
    term: 1,
    cluster: "Measurement and Computation",
    unitCode: "U3",
    competencyTitle: "Perform Mensuration and Calculation",
    weekNumber: 3,
    topicTitle: "Mensuration and Calculation",
    suggestedLessonTitle: "Measuring and Computing Basic Electrical Quantities",
    suggestedObjectives: [
      "Use appropriate units for electrical quantities.",
      "Perform basic calculations for simple electrical values.",
      "Interpret measurement results accurately.",
    ],
    suggestedActivities: [
      "Measurement practice with ruler, tape, and multimeter.",
      "Worked examples on simple electrical calculations.",
    ],
    suggestedAssessment: [
      "Short computation quiz.",
      "Accuracy check on measurement and computation tasks.",
    ],
    orderIndex: 3,
    description: "Basic electrical quantities, units, and computations needed in installation work.",
  },
  {
    code: "EIM12-BC",
    gradeLevel: 12,
    term: 1,
    cluster: "Circuit Design and Protection",
    unitCode: "U4",
    competencyTitle: "Perform Branch Circuit Calculation",
    weekNumber: 4,
    topicTitle: "Branch Circuit Calculation",
    suggestedLessonTitle: "Planning Branch Circuits and Protection",
    suggestedObjectives: [
      "Differentiate continuous and non-continuous loads.",
      "Compute branch circuit requirements accurately.",
      "Select suitable protection for circuit design.",
    ],
    suggestedActivities: [
      "Circuit loading case study.",
      "Breaker sizing and protection selection workshop.",
    ],
    suggestedAssessment: [
      "Problem solving worksheet on branch circuit calculation.",
      "Teacher-reviewed design brief.",
    ],
    orderIndex: 4,
    description: "Continuous and non-continuous loads, circuit protection, and main breaker sizing.",
  },
];

export const EIM_COMPETENCY_LOOKUP = new Map(
  EIM_COMPETENCY_MAP.map((competency) => [
    competency.code.toUpperCase(),
    competency,
  ]),
);

function normalizeNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeOrder(value: number | string | null | undefined): number {
  return normalizeNumber(value) ?? 9999;
}

function getGradeLevel(competency: CompetencyLike): number | null {
  return normalizeNumber(competency.gradeLevel ?? competency.grade_level);
}

function getOrderIndex(competency: CompetencyLike): number {
  return normalizeOrder(competency.orderIndex ?? competency.order_index);
}

export function sortCompetenciesByOrder<T extends CompetencyLike>(
  competencies: T[] | null | undefined,
): T[] {
  return [...(competencies ?? [])].sort(
    (left, right) => getOrderIndex(left) - getOrderIndex(right),
  );
}

export function formatCompetencyLabel(
  competency: CompetencyLike | null | undefined,
): string {
  const code = competency?.code?.trim();
  const title =
    competency?.topicTitle?.trim() ||
    competency?.competencyTitle?.trim() ||
    competency?.description?.trim();

  if (code && title) return `${code} · ${title}`;
  if (code) return code;
  if (title) return title;

  return "Unassigned";
}

export function formatCompetencyShortLabel(
  competency: CompetencyLike | null | undefined,
): string {
  const gradeLevel = competency ? getGradeLevel(competency) : null;
  const term = normalizeNumber(competency?.term);
  const weekNumber = normalizeNumber(competency?.weekNumber);
  const unitCode = competency?.unitCode?.trim();
  const topicTitle =
    competency?.topicTitle?.trim() ||
    competency?.competencyTitle?.trim() ||
    competency?.description?.trim();
  const code = competency?.code?.trim();

  const parts: string[] = [];

  if (gradeLevel) parts.push(`G${gradeLevel}`);
  if (term) parts.push(`T${term}`);
  if (weekNumber) parts.push(`W${String(weekNumber).padStart(2, "0")}`);
  if (unitCode) parts.push(unitCode);

  if (parts.length && topicTitle) return `${parts.join(" ")} · ${topicTitle}`;
  if (code && topicTitle) return `${code} · ${topicTitle}`;
  if (code) return code;
  if (topicTitle) return topicTitle;

  return "Unassigned";
}

export function formatCompetencyGroupLabel(
  group: Partial<CompetencyGroup> | null | undefined,
): string {
  const gradeLabel =
    group?.gradeLevel != null ? `Grade ${group.gradeLevel}` : "Grade";
  const termLabel = group?.term != null ? `Term ${group.term}` : "Term";
  const clusterLabel = group?.cluster?.trim() || "General";

  return `${gradeLabel} • ${termLabel} • ${clusterLabel}`;
}

export function groupCompetenciesByGradeTermCluster(
  competencies: CompetencyLike[] | null | undefined,
): CompetencyGroup[] {
  const groups = new Map<string, CompetencyGroup>();

  for (const competency of competencies ?? []) {
    const gradeLevel = getGradeLevel(competency);
    const term = normalizeNumber(competency.term);
    const cluster = competency.cluster?.trim() || "General";
    const key = `${gradeLevel ?? "unknown"}::${term ?? "unknown"}::${cluster}`;

    if (!groups.has(key)) {
      groups.set(key, {
        gradeLevel,
        term,
        cluster,
        competencies: [],
      });
    }

    groups.get(key)?.competencies.push(competency);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      competencies: sortCompetenciesByOrder(group.competencies),
    }))
    .sort((left, right) => {
      const gradeSort = normalizeOrder(left.gradeLevel) - normalizeOrder(right.gradeLevel);
      if (gradeSort !== 0) return gradeSort;

      const termSort = normalizeOrder(left.term) - normalizeOrder(right.term);
      if (termSort !== 0) return termSort;

      return left.cluster.localeCompare(right.cluster);
    });
}

export function findCompetencyByCode(
  competencies: CompetencyLike[] | null | undefined,
  code: string | null | undefined,
): CompetencyLike | undefined {
  const normalizedCode = code?.trim().toUpperCase();
  if (!normalizedCode) return undefined;

  return (competencies ?? []).find(
    (competency) => competency.code?.trim().toUpperCase() === normalizedCode,
  );
}

export function getCompetenciesByGradeLevel(
  gradeLevel: number | string | null | undefined,
): EimCompetency[] {
  const normalizedGradeLevel = normalizeNumber(gradeLevel);

  return sortCompetenciesByOrder(
    EIM_COMPETENCY_MAP.filter((competency) => {
      if (normalizedGradeLevel === null) return true;
      return competency.gradeLevel === normalizedGradeLevel;
    }),
  );
}

export function getCompetenciesByTerm(
  gradeLevel: number | string | null | undefined,
  term: number | string | null | undefined,
): EimCompetency[] {
  const normalizedGradeLevel = normalizeNumber(gradeLevel);
  const normalizedTerm = normalizeNumber(term);

  return sortCompetenciesByOrder(
    EIM_COMPETENCY_MAP.filter((competency) => {
      const matchesGrade =
        normalizedGradeLevel === null ||
        competency.gradeLevel === normalizedGradeLevel;

      const matchesTerm =
        normalizedTerm === null || competency.term === normalizedTerm;

      return matchesGrade && matchesTerm;
    }),
  );
}

export function getCompetencyByCode(
  code: string | null | undefined,
): EimCompetency | undefined {
  const normalizedCode = code?.trim().toUpperCase();
  if (!normalizedCode) return undefined;

  return EIM_COMPETENCY_LOOKUP.get(normalizedCode);
}