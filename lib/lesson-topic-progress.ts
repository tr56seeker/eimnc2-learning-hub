import type { SupabaseClient } from "@supabase/supabase-js";
import { firstRelation } from "@/lib/relations";

export type LessonTopicProgress = {
  lessonId: string;
  lessonTitle: string;
  competencyCode: string | null;
  read: boolean;
  activity: { total: number; completed: number } | null;
  output: { status: "not_submitted" | "submitted" | "checked" | "returned" } | null;
  assessment: { attempted: boolean; score: number | null; maxScore: number | null } | null;
  percentComplete: number;
};

const INTERACTIVE_BLOCK_TYPES = ["activity", "checklist", "quick_question", "reflection"];

// Computed on read from the four systems this rolls up (lesson_progress,
// lesson_block_progress, assignments/submissions, exams/exam_attempts) rather
// than stored, so it can never drift out of sync with them.
export async function loadLessonTopicProgress(
  supabase: SupabaseClient,
  learnerId: string
): Promise<LessonTopicProgress[]> {
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, order_index, competencies(code)")
    .eq("published", true)
    .order("order_index");

  const lessonRows = lessons ?? [];
  const lessonIds = lessonRows.map((lesson) => lesson.id);
  if (!lessonIds.length) return [];

  const [{ data: readRows }, { data: blockRows }, { data: blockProgressRows }, { data: assignmentRows }, { data: examRows }] = await Promise.all([
    supabase.from("lesson_progress").select("lesson_id, completed").eq("learner_id", learnerId).in("lesson_id", lessonIds),
    supabase.from("lesson_blocks").select("id, lesson_id, block_type").eq("is_active", true).in("lesson_id", lessonIds).in("block_type", INTERACTIVE_BLOCK_TYPES),
    supabase.from("lesson_block_progress").select("block_id, completed").eq("learner_id", learnerId),
    supabase.from("assignments").select("id, lesson_id").eq("is_active", true).in("lesson_id", lessonIds),
    supabase.from("exams").select("id, lesson_id").eq("status", "published").in("lesson_id", lessonIds)
  ]);

  const readByLesson = new Map((readRows ?? []).map((row) => [row.lesson_id, row.completed]));

  const blocksByLesson = new Map<string, string[]>();
  for (const block of blockRows ?? []) {
    if (!blocksByLesson.has(block.lesson_id)) blocksByLesson.set(block.lesson_id, []);
    blocksByLesson.get(block.lesson_id)!.push(block.id);
  }
  const blockCompletedSet = new Set((blockProgressRows ?? []).filter((row) => row.completed).map((row) => row.block_id));

  const assignmentIdsByLesson = new Map<string, string[]>();
  for (const assignment of assignmentRows ?? []) {
    if (!assignment.lesson_id) continue;
    if (!assignmentIdsByLesson.has(assignment.lesson_id)) assignmentIdsByLesson.set(assignment.lesson_id, []);
    assignmentIdsByLesson.get(assignment.lesson_id)!.push(assignment.id);
  }
  const allAssignmentIds = (assignmentRows ?? []).map((row) => row.id);
  const { data: submissionRows } = allAssignmentIds.length
    ? await supabase.from("submissions").select("assignment_id, status").eq("learner_id", learnerId).in("assignment_id", allAssignmentIds)
    : { data: [] as { assignment_id: string; status: string }[] };
  const submissionStatusByAssignment = new Map((submissionRows ?? []).map((row) => [row.assignment_id, row.status]));

  const examIdsByLesson = new Map<string, string[]>();
  for (const exam of examRows ?? []) {
    if (!exam.lesson_id) continue;
    if (!examIdsByLesson.has(exam.lesson_id)) examIdsByLesson.set(exam.lesson_id, []);
    examIdsByLesson.get(exam.lesson_id)!.push(exam.id);
  }
  const allExamIds = (examRows ?? []).map((row) => row.id);
  const { data: attemptRows } = allExamIds.length
    ? await supabase.from("exam_attempts").select("exam_id, status, score, max_score").eq("learner_id", learnerId).in("exam_id", allExamIds).order("created_at", { ascending: false })
    : { data: [] as { exam_id: string; status: string; score: number | null; max_score: number | null }[] };
  const bestAttemptByExam = new Map<string, { status: string; score: number | null; max_score: number | null }>();
  for (const attempt of attemptRows ?? []) {
    if (!bestAttemptByExam.has(attempt.exam_id)) bestAttemptByExam.set(attempt.exam_id, attempt);
  }

  return lessonRows.map((lesson) => {
    const competency = firstRelation(lesson.competencies as { code: string | null } | { code: string | null }[] | null);
    const read = readByLesson.get(lesson.id) ?? false;

    const interactiveBlockIds = blocksByLesson.get(lesson.id) ?? [];
    const activity = interactiveBlockIds.length
      ? { total: interactiveBlockIds.length, completed: interactiveBlockIds.filter((id) => blockCompletedSet.has(id)).length }
      : null;

    const lessonAssignmentIds = assignmentIdsByLesson.get(lesson.id) ?? [];
    let output: LessonTopicProgress["output"] = null;
    if (lessonAssignmentIds.length) {
      const statuses = lessonAssignmentIds.map((id) => submissionStatusByAssignment.get(id));
      const best = statuses.includes("checked") ? "checked" : statuses.includes("returned") ? "returned" : statuses.includes("submitted") ? "submitted" : "not_submitted";
      output = { status: best };
    }

    const lessonExamIds = examIdsByLesson.get(lesson.id) ?? [];
    let assessment: LessonTopicProgress["assessment"] = null;
    if (lessonExamIds.length) {
      const attempts = lessonExamIds.map((id) => bestAttemptByExam.get(id)).filter((attempt): attempt is NonNullable<typeof attempt> => Boolean(attempt));
      const submittedAttempt = attempts.find((attempt) => attempt.status === "submitted");
      assessment = submittedAttempt
        ? { attempted: true, score: submittedAttempt.score, maxScore: submittedAttempt.max_score }
        : { attempted: false, score: null, maxScore: null };
    }

    const applicableItems = [
      true, // reading always applies
      activity !== null,
      output !== null,
      assessment !== null
    ].filter(Boolean).length;
    const completedItems = [
      read,
      activity !== null && activity.total > 0 && activity.completed === activity.total,
      output !== null && (output.status === "submitted" || output.status === "checked" || output.status === "returned"),
      assessment !== null && assessment.attempted
    ].filter(Boolean).length;

    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      competencyCode: competency?.code ?? null,
      read,
      activity,
      output,
      assessment,
      percentComplete: applicableItems ? Math.round((completedItems / applicableItems) * 100) : 0
    };
  });
}
