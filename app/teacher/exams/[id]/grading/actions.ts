"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { firstRelation } from "@/lib/relations";

export async function gradeEssayAnswerAction(examId: string, answerId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const rawScore = Number(formData.get("score") ?? 0);

  const { data: answer, error: answerError } = await supabase
    .from("exam_answers")
    .select("id, attempt_id, question_id")
    .eq("id", answerId)
    .maybeSingle();

  if (answerError || !answer) {
    redirect(`/teacher/exams/${examId}/grading?error=${encodeURIComponent("Answer not found or not authorized.")}`);
  }

  const { data: examQuestion } = await supabase
    .from("exam_questions")
    .select("points_override, question_bank(points)")
    .eq("exam_id", examId)
    .eq("question_id", answer.question_id)
    .maybeSingle<{ points_override: number | null; question_bank: { points: number | null } | { points: number | null }[] | null }>();

  const basePoints = firstRelation(examQuestion?.question_bank ?? null)?.points;
  const maxPoints = examQuestion?.points_override ?? basePoints ?? 1;
  const clampedScore = Math.max(0, Math.min(maxPoints, Number.isFinite(rawScore) ? rawScore : 0));

  const { error: updateAnswerError } = await supabase
    .from("exam_answers")
    .update({ score_awarded: clampedScore })
    .eq("id", answerId);

  if (updateAnswerError) {
    redirect(`/teacher/exams/${examId}/grading?error=${encodeURIComponent(updateAnswerError.message)}`);
  }

  // Recompute the attempt's total from every answer (objective + essay)
  // rather than just adding a delta, so the total always reflects reality.
  const { data: allAnswers } = await supabase
    .from("exam_answers")
    .select("score_awarded")
    .eq("attempt_id", answer.attempt_id);

  const newScore = (allAnswers ?? []).reduce((sum, row) => sum + Number(row.score_awarded ?? 0), 0);

  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("learner_id")
    .eq("id", answer.attempt_id)
    .maybeSingle();

  await supabase.from("exam_attempts").update({ score: newScore }).eq("id", answer.attempt_id);

  if (attempt) {
    await supabase
      .from("grades")
      .update({ score: newScore })
      .eq("learner_id", attempt.learner_id)
      .eq("source_type", "exam")
      .eq("source_id", examId);
  }

  revalidatePath(`/teacher/exams/${examId}/grading`);
  revalidatePath(`/teacher/exams/${examId}/analysis`);
  revalidatePath("/teacher/mastery");
  revalidatePath("/learner/grades");
  redirect(`/teacher/exams/${examId}/grading?message=${encodeURIComponent("Score saved.")}`);
}
