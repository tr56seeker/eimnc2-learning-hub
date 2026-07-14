"use server";

import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";

export async function scoreSubmissionAction(formData: FormData) {
  const { supabase } = await requireTeacher();
  const submissionId = String(formData.get("submission_id") ?? "");
  const assignmentTitle = String(formData.get("assignment_title") ?? "Output");
  const score = Number(formData.get("score") ?? 0);
  const maxScore = Number(formData.get("max_score") ?? 0);
  const feedback = String(formData.get("feedback") ?? "").trim();

  // Look up the submission's own learner_id rather than trusting the
  // client-supplied hidden field, so a forged form post can't attribute
  // this score to a different learner.
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("id, learner_id")
    .eq("id", submissionId)
    .maybeSingle();

  if (submissionError || !submission) {
    redirect(`/teacher/submissions?error=${encodeURIComponent("Submission not found or not authorized.")}`);
  }

  const { error } = await supabase
    .from("submissions")
    .update({ score, feedback, status: "checked" })
    .eq("id", submissionId);

  if (error) redirect(`/teacher/submissions?error=${encodeURIComponent(error.message)}`);

  // Upsert (not insert) so re-scoring the same submission updates its one
  // grade row instead of adding a duplicate that inflates the learner's
  // counted average.
  await supabase.from("grades").upsert(
    {
      learner_id: submission.learner_id,
      source_type: "submission",
      source_id: submissionId,
      title: assignmentTitle,
      score,
      max_score: maxScore,
      component: "performance_task"
    },
    { onConflict: "learner_id,source_type,source_id" }
  );

  redirect("/teacher/submissions?message=Submission checked and encoded.");
}

export async function returnSubmissionForRevisionAction(formData: FormData) {
  const { supabase } = await requireTeacher();
  const submissionId = String(formData.get("submission_id") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();

  if (!feedback) {
    redirect(`/teacher/submissions?error=${encodeURIComponent("Add feedback explaining what needs revision before returning it.")}`);
  }

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("id")
    .eq("id", submissionId)
    .maybeSingle();

  if (submissionError || !submission) {
    redirect(`/teacher/submissions?error=${encodeURIComponent("Submission not found or not authorized.")}`);
  }

  const { error } = await supabase
    .from("submissions")
    .update({ status: "returned", feedback })
    .eq("id", submissionId);

  if (error) redirect(`/teacher/submissions?error=${encodeURIComponent(error.message)}`);

  redirect("/teacher/submissions?message=Returned to learner for revision.");
}
