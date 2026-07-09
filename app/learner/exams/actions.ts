"use server";

import { redirect } from "next/navigation";
import { requireLearner } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type QuestionRow = {
  points_override: number | null;
  question_bank: {
    id: string;
    question_type: "multiple_choice" | "true_false" | "identification" | "essay";
    correct_answer: string | null;
    points: number | null;
  } | null;
};

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function submitExamAction(examId: string, formData: FormData) {
  const { profile } = await requireLearner();
  const admin = createAdminClient();

  const { data: exam } = await admin
    .from("exams")
    .select("id, title, status")
    .eq("id", examId)
    .eq("status", "published")
    .single();

  if (!exam) redirect("/learner/exams?message=Exam is not available");

  const { data: existingAttempts } = await admin
    .from("exam_attempts")
    .select("id")
    .eq("exam_id", examId)
    .eq("learner_id", profile.id)
    .eq("status", "submitted");

  if ((existingAttempts?.length ?? 0) >= 1) {
    redirect(`/learner/exams/${examId}?message=You already submitted this exam.`);
  }

  const { data: rows, error: questionsError } = await admin
    .from("exam_questions")
    .select("points_override, question_bank(id, question_type, correct_answer, points)")
    .eq("exam_id", examId)
    .order("order_index")
    .returns<QuestionRow[]>();

  if (questionsError || !rows?.length) {
    redirect(`/learner/exams/${examId}?message=No questions found.`);
  }

  let score = 0;
  let maxScore = 0;

  const { data: attempt, error: attemptError } = await admin
    .from("exam_attempts")
    .insert({
      exam_id: examId,
      learner_id: profile.id,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      score: 0,
      max_score: 0
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    redirect(`/learner/exams/${examId}?message=Unable to create exam attempt.`);
  }

  const answers = rows.flatMap((row) => {
    const question = row.question_bank;
    if (!question) return [];

    const points = Number(row.points_override ?? question.points ?? 1);
    maxScore += points;

    const answerText = String(formData.get(`q_${question.id}`) ?? "");
    let isCorrect: boolean | null = null;
    let scoreAwarded = 0;

    if (question.question_type === "essay") {
      isCorrect = null;
      scoreAwarded = 0;
    } else {
      isCorrect = normalizeAnswer(answerText) === normalizeAnswer(question.correct_answer ?? "");
      scoreAwarded = isCorrect ? points : 0;
    }

    score += scoreAwarded;

    return [{
      attempt_id: attempt.id,
      question_id: question.id,
      answer_text: answerText,
      is_correct: isCorrect,
      score_awarded: scoreAwarded
    }];
  });

  if (answers.length) {
    await admin.from("exam_answers").insert(answers);
  }

  await admin
    .from("exam_attempts")
    .update({ score, max_score: maxScore })
    .eq("id", attempt.id);

  await admin.from("grades").insert({
    learner_id: profile.id,
    source_type: "exam",
    source_id: attempt.id,
    title: exam.title,
    score,
    max_score: maxScore,
    component: "written_work"
  });

  redirect(`/learner/grades?message=Exam submitted. Score: ${score}/${maxScore}`);
}
