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

// Called in real time by ExamIntegrityGuard as each violation happens, so
// the violation count is a server-persisted tally instead of a single
// client-supplied field trusted at submit time (a learner could otherwise
// just submit a plain form post with violation_count=0 and bypass the
// guard entirely). Ownership of the attempt is verified explicitly since
// this uses the service-role client, which bypasses RLS.
export async function recordExamViolationAction(attemptId: string, maxViolations: number) {
  const { profile } = await requireLearner();
  const admin = createAdminClient();

  const { data: attempt } = await admin
    .from("exam_attempts")
    .select("id, violation_count")
    .eq("id", attemptId)
    .eq("learner_id", profile.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (!attempt) {
    return { violationCount: 0, terminated: false };
  }

  const nextCount = (attempt.violation_count ?? 0) + 1;
  const terminated = nextCount > maxViolations;

  await admin
    .from("exam_attempts")
    .update({
      violation_count: nextCount,
      ...(terminated
        ? { termination_reason: `Auto-submitted after exceeding ${maxViolations} allowed violations during the exam.` }
        : {})
    })
    .eq("id", attemptId);

  return { violationCount: nextCount, terminated };
}

// Called by ExamAutosave as the learner types/selects, well before final
// submission, so a crashed browser or dropped connection doesn't erase
// their answers. Uses the RLS-scoped client (not the admin client) since
// exam_attempt_drafts' own RLS policy already verifies the attempt belongs
// to the calling learner and is still in progress.
export async function saveExamDraftAnswerAction(attemptId: string, questionId: string, answerText: string) {
  const { supabase } = await requireLearner();

  const { error } = await supabase.from("exam_attempt_drafts").upsert(
    {
      attempt_id: attemptId,
      question_id: questionId,
      answer_text: answerText,
      updated_at: new Date().toISOString()
    },
    { onConflict: "attempt_id,question_id" }
  );

  return { ok: !error };
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

  if (!exam) redirect("/learner/exams?error=Exam is not available");

  const now = Date.now();
  if (exam.start_at && now < new Date(exam.start_at).getTime()) {
    redirect("/learner/exams?error=Exam is not open yet.");
  }

  if (exam.end_at && now > new Date(exam.end_at).getTime()) {
    redirect("/learner/exams?error=Exam is already closed.");
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

  if (!attempt) {
    const { data: existingAttempts } = await admin
      .from("exam_attempts")
      .select("id")
      .eq("exam_id", examId)
      .eq("learner_id", profile.id)
      .eq("status", "submitted");

    if ((existingAttempts?.length ?? 0) >= 1) {
      redirect(`/learner/exams/${examId}?error=You already submitted this exam.`);
    }

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
      redirect(`/learner/exams/${examId}?error=Unable to create exam attempt.`);
    }

    attempt = createdAttempt;
  } else {
    const durationMs = Number(exam.duration_minutes ?? 30) * 60 * 1000;
    const startedAt = new Date(attempt.started_at).getTime();
    if (Number.isFinite(startedAt) && now > startedAt + durationMs + 30_000) {
      redirect(`/learner/exams/${examId}?error=Time limit reached. Ask your teacher for assistance.`);
    }
  }

  const { data: rows, error: questionsError } = await admin
    .from("exam_questions")
    .select("points_override, question_bank(id, question_type, correct_answer, points)")
    .eq("exam_id", examId)
    .order("order_index")
    .returns<QuestionRow[]>();

  if (questionsError || !rows?.length) {
    redirect(`/learner/exams/${examId}?error=No questions found.`);
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

  // violation_count and termination_reason are NOT read from the submitted
  // form — they're already current on this row from real-time
  // recordExamViolationAction calls during the attempt, which is the
  // server-persisted source of truth. Trusting a client-supplied field here
  // would let a learner submit a forged clean payload and bypass the guard.
  const { data: attemptState } = await admin
    .from("exam_attempts")
    .select("termination_reason")
    .eq("id", attempt.id)
    .maybeSingle();
  const terminationReason = attemptState?.termination_reason ?? null;
  const terminationSummary = formData.get("termination_summary");

  await admin
    .from("exam_attempts")
    .update({
      score,
      max_score: maxScore,
      status: "submitted",
      submitted_at: new Date().toISOString()
    })
    .eq("id", attempt.id);

  // source_id is the exam, not the attempt, and this is an upsert (not
  // insert) so a retake replaces the learner's previous score for this exam
  // instead of adding a second grades row that would double-count both the
  // original and the retake in the learner's own average and every teacher
  // report derived from `grades`.
  await admin.from("grades").upsert(
    {
      learner_id: profile.id,
      source_type: "exam",
      source_id: examId,
      title: exam.title,
      score,
      max_score: maxScore,
      component: "written_work"
    },
    { onConflict: "learner_id,source_type,source_id" }
  );

  await admin
    .from("exam_retake_grants")
    .update({ used: true })
    .eq("exam_id", examId)
    .eq("learner_id", profile.id)
    .eq("used", false);

  // The attempt is now scored and submitted; the autosaved drafts that got
  // it there are no longer needed.
  await admin.from("exam_attempt_drafts").delete().eq("attempt_id", attempt.id);

  const showResult = exam.show_result_after_submit ?? exam.show_score_after_submit ?? true;
  if (terminationReason) {
    const reasonText = terminationSummary ? String(terminationSummary) : "Policy violations detected.";
    redirect(`/learner/exams?violation=1&message=${encodeURIComponent(reasonText)}`);
  }
  redirect(showResult ? `/learner/grades?message=Exam submitted. Score: ${score}/${maxScore}` : "/learner/exams?message=Exam submitted.");
}
