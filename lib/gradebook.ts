export const gradebookWeights = {
  written: 0.15,
  performance: 0.65,
  exam: 0.2
} as const;

export const termOptions = ["First Term", "Second Term", "Third Term"] as const;

export type GradebookTerm = (typeof termOptions)[number];
export type EditableAssessmentCategory = "written" | "performance" | "summative" | "term_exam";

export type EditableGradebookAssessment = {
  id: string;
  term: GradebookTerm | string;
  category: EditableAssessmentCategory;
  label: string;
  highestPossible: number | null;
  displayOrder: number;
  isActive: boolean;
};

export type EditableLearner = {
  id: string;
  rowNumber: number;
  fullName: string;
  lrn: string | null;
  sectionName: string | null;
};

export type EditableGradebookScore = {
  assessmentId: string;
  learnerId: string;
  score: number | null;
};

export type GradebookCell = {
  score: number | null;
  maxScore: number | null;
  title?: string | null;
};

export type GradebookComputed = {
  total: number | null;
  highestPossible: number;
  ps: number | null;
  ws: number | null;
};

export type GradebookMatrixRow = {
  learnerId: string;
  rowNumber: number;
  fullName: string;
  lrn: string | null;
  sectionName: string | null;
  written: GradebookCell[];
  performance: GradebookCell[];
  exams: GradebookCell[];
  writtenComputed: GradebookComputed;
  performanceComputed: GradebookComputed;
  examComputed: GradebookComputed;
  initialGrade: number | null;
  transmutedGrade: number | null;
  letterGrade: string | null;
};

export type TermSummaryRow = {
  learnerId: string;
  rowNumber: number;
  fullName: string;
  lrn: string | null;
  sectionName: string | null;
  firstTerm: number | null;
  secondTerm: number | null;
  thirdTerm: number | null;
  average: number | null;
  remarks: string | null;
};

export type GradebookHighestScores = {
  written: Array<number | null>;
  performance: Array<number | null>;
  exams: Array<number | null>;
  writtenTotal: number;
  performanceTotal: number;
  examTotal: number;
};

export function totalScore(scores: Array<number | null | undefined>): number {
  return scores.reduce<number>((sum, score) => sum + (Number.isFinite(Number(score)) ? Number(score) : 0), 0);
}

export function percentageScore(total: number | null | undefined, highestPossible: number | null | undefined) {
  if (total === null || total === undefined || !highestPossible) return null;
  return (Number(total) / Number(highestPossible)) * 100;
}

export function weightedScore(ps: number | null | undefined, weight: number) {
  if (ps === null || ps === undefined || !Number.isFinite(ps)) return null;
  return ps * weight;
}

export function initialGrade(
  writtenWS: number | null | undefined,
  performanceWS: number | null | undefined,
  examWS: number | null | undefined
) {
  const scores = [writtenWS, performanceWS, examWS].filter((score): score is number => score !== null && score !== undefined);
  if (!scores.length) return null;
  return totalScore(scores);
}

export function transmutedGrade(initial: number | null | undefined) {
  if (initial === null || initial === undefined) return null;
  // TODO: Replace with official DepEd transmutation table based on the confirmed classroom assessment and grading policy.
  return Math.round(initial);
}

export function letterGrade(transmuted: number | null | undefined) {
  if (transmuted === null || transmuted === undefined) return null;
  // TODO: Replace labels with official school/DepEd grade descriptors if required.
  if (transmuted >= 90) return "A";
  if (transmuted >= 85) return "B";
  if (transmuted >= 80) return "C";
  if (transmuted >= 75) return "D";
  return "Did Not Meet Expectations";
}

export function termAverage(termGrades: Array<number | null | undefined>) {
  if (termGrades.some((grade) => grade === null || grade === undefined)) return null;
  return totalScore(termGrades) / termGrades.length;
}

export function termRemarks(average: number | null | undefined) {
  if (average === null || average === undefined) return null;
  return average >= 75 ? "Passed" : "Failed";
}

export function isGradebookTerm(value: string): value is GradebookTerm {
  return termOptions.includes(value as GradebookTerm);
}

export function categoryComputed(cells: GradebookCell[], highestPossible: number, weight: number): GradebookComputed {
  const hasScore = cells.some((cell) => cell.score !== null && cell.score !== undefined);
  const total = hasScore ? totalScore(cells.map((cell) => cell.score)) : null;
  const ps = percentageScore(total, highestPossible);
  const ws = weightedScore(ps, weight);

  return { total, highestPossible, ps, ws };
}

export function fixedCells(cells: GradebookCell[], count: number) {
  return Array.from({ length: count }, (_, index) => cells[index] ?? { score: null, maxScore: null });
}

type LearnerNameParts = {
  fullName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
};

function cleanNamePart(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function upperNamePart(value: string | null | undefined) {
  return cleanNamePart(value).toLocaleUpperCase("en-US");
}

function middleInitial(value: string | null | undefined) {
  const cleaned = cleanNamePart(value).replace(/\./g, "");
  return cleaned ? `${cleaned.charAt(0).toLocaleUpperCase("en-US")}.` : "";
}

function hasMiddleInitialShape(value: string | undefined) {
  return Boolean(value && /^[A-Za-z]\.?$/.test(value));
}

function formattedNameFromParts(lastName: string, firstName: string, middleName?: string | null) {
  const last = upperNamePart(lastName);
  const first = upperNamePart(firstName);
  const middle = middleInitial(middleName);

  if (!last && !first) return "";
  if (!last) return [first, middle].filter(Boolean).join(" ");
  if (!first) return last;
  return `${last}, ${[first, middle].filter(Boolean).join(" ")}`;
}

export function formatClassRecordName(source: string | LearnerNameParts | null | undefined) {
  const fullName = typeof source === "string" ? source : source?.fullName;
  const firstName = typeof source === "string" ? null : source?.firstName;
  const middleName = typeof source === "string" ? null : source?.middleName;
  const lastName = typeof source === "string" ? null : source?.lastName;

  if (lastName || firstName) {
    return formattedNameFromParts(lastName ?? "", firstName ?? "", middleName);
  }

  const cleaned = cleanNamePart(fullName);
  if (!cleaned) return "UNNAMED LEARNER";

  if (cleaned.includes(",")) {
    const [last, ...givenParts] = cleaned.split(",");
    const givenTokens = cleanNamePart(givenParts.join(",")).split(" ").filter(Boolean);
    const middle = givenTokens.length > 1 ? givenTokens.at(-1) : "";
    const first = givenTokens.length > 1 ? givenTokens.slice(0, -1).join(" ") : givenTokens.join(" ");
    return formattedNameFromParts(last, first, middle);
  }

  const tokens = cleaned.split(" ").filter(Boolean);
  if (tokens.length === 1) return upperNamePart(tokens[0]);
  if (tokens.length === 2) return formattedNameFromParts(tokens[1], tokens[0]);
  if (tokens.length === 3) return formattedNameFromParts(tokens[2], tokens[0], tokens[1]);

  const surnamePrefixes = new Set(["DE", "DEL", "DELA", "LA", "LAS", "LOS", "SAN", "SANTA", "SANTO", "VAN", "VON"]);
  const possiblePrefix = tokens.at(-2)?.toLocaleUpperCase("en-US") ?? "";
  const lastStart = surnamePrefixes.has(possiblePrefix) ? tokens.length - 2 : tokens.length - 1;

  if (lastStart === tokens.length - 1 && hasMiddleInitialShape(tokens[1])) {
    return formattedNameFromParts(tokens.slice(2).join(" "), tokens[0], tokens[1]);
  }

  const first = tokens.slice(0, Math.max(1, lastStart - 1)).join(" ");
  const middle = tokens[lastStart - 1];
  const last = tokens.slice(lastStart).join(" ");
  return formattedNameFromParts(last, first, middle);
}

export function formatGradebookNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  return Number(value).toFixed(digits);
}

export function formatGradebookScore(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "";
  return Number(value).toString();
}
