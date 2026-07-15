import type { SupabaseClient } from "@supabase/supabase-js";
import { firstRelation } from "@/lib/relations";

export type ReportSection = {
  id: string;
  name: string;
  grade_level: number | string | null;
  school_year: string | null;
  is_active: boolean;
};

export type ReportLearner = {
  id: string;
  full_name: string;
  lrn: string | null;
  section_id: string | null;
};

export type ReportAssignment = {
  id: string;
  title: string;
  due_at: string | null;
};

export type ProgressBaseData = {
  sections: ReportSection[];
  learners: ReportLearner[];
  totalPublishedLessons: number;
  completedLessonCountByLearner: Map<string, number>;
  activeAssignments: ReportAssignment[];
  submittedAssignmentPairs: Set<string>;
  lateCountByLearner: Map<string, number>;
  examStatsByLearner: Map<string, { totalScore: number; totalMax: number; attempts: number }>;
  lastActivityByLearner: Map<string, string>;
  openIncidentCountByLearner: Map<string, number>;
};

const OPEN_INCIDENT_STATUSES = new Set(["needs_review", "possible_violation", "escalated"]);

function pairKey(learnerId: string, assignmentId: string) {
  return `${learnerId}:${assignmentId}`;
}

function newerTimestamp(a: string | undefined, b: string | null | undefined) {
  if (!b) return a;
  if (!a) return b;
  return b > a ? b : a;
}

/**
 * Single shared set of queries backing the class, learner, and intervention
 * reports so each page doesn't re-derive completion/missing/late/exam-score
 * signals with its own slightly different logic.
 */
export async function loadProgressBaseData(supabase: SupabaseClient): Promise<ProgressBaseData> {
  const [
    { data: sections },
    { data: learners },
    { count: totalPublishedLessons },
    { data: lessonProgress },
    { data: activeAssignments },
    { data: submissions },
    { data: examAttempts },
    { data: incidentReviews }
  ] = await Promise.all([
    supabase.from("sections").select("id, name, grade_level, school_year, is_active").returns<ReportSection[]>(),
    supabase
      .from("profiles")
      .select("id, full_name, lrn, section_id")
      .eq("role", "learner")
      .eq("status", "active")
      .returns<ReportLearner[]>(),
    supabase.from("lessons").select("id", { count: "exact", head: true }).eq("published", true),
    supabase.from("lesson_progress").select("learner_id, completed").eq("completed", true),
    supabase.from("assignments").select("id, title, due_at").eq("is_active", true).returns<ReportAssignment[]>(),
    supabase.from("submissions").select("learner_id, assignment_id, submitted_at"),
    supabase
      .from("exam_attempts")
      .select("id, exam_id, learner_id, score, max_score, submitted_at")
      .eq("status", "submitted"),
    supabase
      .from("exam_incident_reviews")
      .select("status, exam_attempts(learner_id)")
  ]);

  const completedLessonCountByLearner = new Map<string, number>();
  for (const row of lessonProgress ?? []) {
    completedLessonCountByLearner.set(row.learner_id, (completedLessonCountByLearner.get(row.learner_id) ?? 0) + 1);
  }

  const assignmentById = new Map((activeAssignments ?? []).map((assignment) => [assignment.id, assignment]));
  const submittedAssignmentPairs = new Set<string>();
  const lateCountByLearner = new Map<string, number>();
  const lastActivityByLearner = new Map<string, string>();

  for (const row of submissions ?? []) {
    submittedAssignmentPairs.add(pairKey(row.learner_id, row.assignment_id));
    lastActivityByLearner.set(row.learner_id, newerTimestamp(lastActivityByLearner.get(row.learner_id), row.submitted_at) ?? row.submitted_at);

    const assignment = assignmentById.get(row.assignment_id);
    if (assignment?.due_at && row.submitted_at && new Date(row.submitted_at).getTime() > new Date(assignment.due_at).getTime()) {
      lateCountByLearner.set(row.learner_id, (lateCountByLearner.get(row.learner_id) ?? 0) + 1);
    }
  }

  // Latest submitted attempt per learner+exam wins, matching the mastery report's rule.
  const latestAttemptByKey = new Map<string, { learner_id: string; score: number | null; max_score: number | null; submitted_at: string | null }>();
  for (const attempt of examAttempts ?? []) {
    const key = `${attempt.learner_id}:${attempt.exam_id}`;
    const existing = latestAttemptByKey.get(key);
    if (!existing || (attempt.submitted_at ?? "") > (existing.submitted_at ?? "")) {
      latestAttemptByKey.set(key, attempt);
    }
  }

  const examStatsByLearner = new Map<string, { totalScore: number; totalMax: number; attempts: number }>();
  for (const attempt of latestAttemptByKey.values()) {
    const stats = examStatsByLearner.get(attempt.learner_id) ?? { totalScore: 0, totalMax: 0, attempts: 0 };
    stats.totalScore += Number(attempt.score ?? 0);
    stats.totalMax += Number(attempt.max_score ?? 0);
    stats.attempts += 1;
    examStatsByLearner.set(attempt.learner_id, stats);
    lastActivityByLearner.set(
      attempt.learner_id,
      newerTimestamp(lastActivityByLearner.get(attempt.learner_id), attempt.submitted_at) ?? attempt.submitted_at ?? ""
    );
  }

  const openIncidentCountByLearner = new Map<string, number>();
  for (const row of incidentReviews ?? []) {
    if (!OPEN_INCIDENT_STATUSES.has(row.status)) continue;
    const attempt = firstRelation(row.exam_attempts as { learner_id: string } | { learner_id: string }[] | null);
    if (!attempt?.learner_id) continue;
    openIncidentCountByLearner.set(attempt.learner_id, (openIncidentCountByLearner.get(attempt.learner_id) ?? 0) + 1);
  }

  return {
    sections: sections ?? [],
    learners: learners ?? [],
    totalPublishedLessons: totalPublishedLessons ?? 0,
    completedLessonCountByLearner,
    activeAssignments: activeAssignments ?? [],
    submittedAssignmentPairs,
    lateCountByLearner,
    examStatsByLearner,
    lastActivityByLearner,
    openIncidentCountByLearner
  };
}

export function missingAssignmentCount(data: ProgressBaseData, learnerId: string) {
  const now = Date.now();
  let missing = 0;
  for (const assignment of data.activeAssignments) {
    if (!assignment.due_at || new Date(assignment.due_at).getTime() > now) continue;
    if (!data.submittedAssignmentPairs.has(pairKey(learnerId, assignment.id))) missing += 1;
  }
  return missing;
}

export function examScorePercent(data: ProgressBaseData, learnerId: string) {
  const stats = data.examStatsByLearner.get(learnerId);
  if (!stats || stats.totalMax <= 0) return null;
  return Math.round((stats.totalScore / stats.totalMax) * 100);
}

export function lessonCompletionPercent(data: ProgressBaseData, learnerId: string) {
  if (data.totalPublishedLessons <= 0) return 0;
  return Math.round(((data.completedLessonCountByLearner.get(learnerId) ?? 0) / data.totalPublishedLessons) * 100);
}

export function activityCompletionPercent(data: ProgressBaseData, learnerId: string) {
  if (data.activeAssignments.length <= 0) return 0;
  const submitted = data.activeAssignments.filter((assignment) => data.submittedAssignmentPairs.has(pairKey(learnerId, assignment.id))).length;
  return Math.round((submitted / data.activeAssignments.length) * 100);
}

// Item analysis --------------------------------------------------------

export type ExamOption = { id: string; title: string; status: string };

export type ItemAnalysisRow = {
  questionId: string;
  questionText: string;
  attempts: number;
  gradedAttempts: number;
  correctCount: number;
  correctPct: number;
  avgScorePct: number;
};

export async function loadExamOptions(supabase: SupabaseClient) {
  const { data } = await supabase.from("exams").select("id, title, status").order("created_at", { ascending: false }).returns<ExamOption[]>();
  return data ?? [];
}

export async function loadItemAnalysis(supabase: SupabaseClient, examId: string): Promise<ItemAnalysisRow[]> {
  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("id, learner_id, submitted_at")
    .eq("exam_id", examId)
    .eq("status", "submitted");

  const latestAttemptIdByLearner = new Map<string, { id: string; submitted_at: string | null }>();
  for (const attempt of attempts ?? []) {
    const existing = latestAttemptIdByLearner.get(attempt.learner_id);
    if (!existing || (attempt.submitted_at ?? "") > (existing.submitted_at ?? "")) {
      latestAttemptIdByLearner.set(attempt.learner_id, attempt);
    }
  }
  const attemptIds = [...latestAttemptIdByLearner.values()].map((attempt) => attempt.id);
  if (!attemptIds.length) return [];

  const { data: answers } = await supabase
    .from("exam_answers")
    .select("question_id, is_correct, score_awarded, question_bank(question_text, points)")
    .in("attempt_id", attemptIds)
    .returns<
      { question_id: string; is_correct: boolean | null; score_awarded: number | null; question_bank: { question_text: string; points: number } | { question_text: string; points: number }[] | null }[]
    >();

  type Bucket = { questionText: string; points: number; attempts: number; gradedAttempts: number; correctCount: number; scoreTotal: number };
  const buckets = new Map<string, Bucket>();

  for (const answer of answers ?? []) {
    const question = firstRelation(answer.question_bank);
    const bucket =
      buckets.get(answer.question_id) ??
      ({ questionText: question?.question_text ?? "Untitled question", points: Number(question?.points ?? 1), attempts: 0, gradedAttempts: 0, correctCount: 0, scoreTotal: 0 } as Bucket);

    bucket.attempts += 1;
    bucket.scoreTotal += Number(answer.score_awarded ?? 0);
    if (answer.is_correct !== null) {
      bucket.gradedAttempts += 1;
      if (answer.is_correct) bucket.correctCount += 1;
    }

    buckets.set(answer.question_id, bucket);
  }

  return [...buckets.entries()]
    .map(([questionId, bucket]) => ({
      questionId,
      questionText: bucket.questionText,
      attempts: bucket.attempts,
      gradedAttempts: bucket.gradedAttempts,
      correctCount: bucket.correctCount,
      correctPct: bucket.gradedAttempts > 0 ? Math.round((bucket.correctCount / bucket.gradedAttempts) * 100) : 0,
      avgScorePct: bucket.attempts > 0 && bucket.points > 0 ? Math.round((bucket.scoreTotal / bucket.attempts / bucket.points) * 100) : 0
    }))
    .sort((left, right) => left.correctPct - right.correctPct);
}
