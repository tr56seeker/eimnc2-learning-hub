"use server";

import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";

export async function scoreSubmissionAction(formData: FormData) {
  const { supabase } = await requireTeacher();
  const submissionId = String(formData.get("submission_id") ?? "");
  const learnerId = String(formData.get("learner_id") ?? "");
  const assignmentTitle = String(formData.get("assignment_title") ?? "Output");
  const score = Number(formData.get("score") ?? 0);
  const maxScore = Number(formData.get("max_score") ?? 0);
  const feedback = String(formData.get("feedback") ?? "").trim();

  const { error } = await supabase
    .from("submissions")
    .update({ score, feedback, status: "checked" })
    .eq("id", submissionId);

  if (error) redirect(`/teacher/submissions?message=${encodeURIComponent(error.message)}`);

  await supabase.from("grades").insert({
    learner_id: learnerId,
    source_type: "submission",
    source_id: submissionId,
    title: assignmentTitle,
    score,
    max_score: maxScore,
    component: "performance_task"
  });

  redirect("/teacher/submissions?message=Submission checked and encoded.");
}
