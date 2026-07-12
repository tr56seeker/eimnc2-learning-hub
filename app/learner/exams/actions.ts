"use server";

import { redirect } from "next/navigation";
import { requireLearner } from "@/lib/auth";
import { firstRelation } from "@/lib/relations";
import { createAdminClient } from "@/lib/supabase/admin";

type QuestionRow = {
  points_override: number | null;
  question_bank: {
    id: string;
    question_type: "multiple_choice" | "true_false" | "identification" | "essay";
    correct_answer: string | null;
    points: number | null;
  } | {
    id: string;
    question_type: "multiple_choice" | "true_false" | "identification" | "essay";
    correct_answer: string | null;
    points: number | null;
  }[] | null;
};

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function submitExamAction(examId: string, formData: FormData) {
  const { profile } = await requireLearner();
  const admin = createAdminClient();

  const { data: exam } = await admin
    .from("exams")
    .select("id, title, status, start_at, end_at, duration_minutes, show_result_after_submit, show_score_after_submit")
    .eq("id", examId)
    .eq("status", "published")
    .single();

  if (!exam) redirect("/learner/exams?message=Exam is not available");

  const now = Date.now();
  if (exam.start_at && now < new Date(exam.start_at).getTime()) {
    redirect("/learner/exams?message=Exam is not open yet.");
  }

  if (exam.end_at && now > new Date(exam.end_at).getTime()) {
    redirect("/learner/exams?message=Exam is already closed.");
  }

  const { data: existingAttempts } = await admin
    .from("exam_attempts")
    .select("id")
    .eq("exam_id", examId)
    .eq("learner_id", profile.id)
    .eq("status", "submitted");

  if ((existingAttempts?.length ?? 0) >= 1) {
    redirect(`/learner/exams/${examId}?message=You already submitted this exam.`);
  }

  const { data: inProgressAttempts } = await admin
    .from("exam_attempts")
    .select("id, started_at")
    .eq("exam_id", examId)
    .eq("learner_id", profile.id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: true })
    .limit(1);

  let attempt = inProgressAttempts?.[0] ?? null;

  if (attempt) {
    const durationMs = Number(exam.duration_minutes ?? 30) * 60 * 1000;
    const startedAt = new Date(attempt.started_at).getTime();
    if (Number.isFinite(startedAt) && now > startedAt + durationMs + 30_000) {
      redirect(`/learner/exams/${examId}?message=Time limit reached. Ask your teacher for assistance.`);
    }
  } else {
    const { data: createdAttempt, error: createAttemptError } = await admin
      .from("exam_attempts")
      .insert({
        exam_id: examId,
        learner_id: profile.id,
        status: "in_progress",
        score: 0,
        max_score: 0
      })
      .select("id, started_at")
      .single();

    if (createAttemptError || !createdAttempt) {
      redirect(`/learner/exams/${examId}?message=Unable to create exam attempt.`);
    }

    attempt = createdAttempt;
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

  const answers = rows.flatMap((row) => {
    const question = firstRelation(row.question_bank);
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

  const violationCount = Number(formData.get("violation_count") ?? 0);
  const terminationReason = formData.get("termination_reason");
  const terminationSummary = formData.get("termination_summary");

  await admin
    .from("exam_attempts")
    .update({
      score,
      max_score: maxScore,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      violation_count: violationCount,
      termination_reason: terminationReason ? String(terminationReason) : null
    })
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

  const showResult = exam.show_result_after_submit ?? exam.show_score_after_submit ?? true;
  if (terminationReason) {
    const reasonText = terminationSummary ? String(terminationSummary) : "Policy violations detected.";
    redirect(`/learner/exams?violation=1&message=${encodeURIComponent(reasonText)}`);
  }
  redirect(showResult ? `/learner/grades?message=Exam submitted. Score: ${score}/${maxScore}` : "/learner/exams?message=Exam submitted.");
}
