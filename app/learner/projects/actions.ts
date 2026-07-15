"use server";

import { redirect } from "next/navigation";
import { requireLearner } from "@/lib/auth";

export async function submitMilestoneEvidenceAction(formData: FormData) {
  const { profile, supabase } = await requireLearner();
  const milestoneId = String(formData.get("milestone_id") ?? "");
  const contentText = String(formData.get("content_text") ?? "").trim();
  const fileUrl = String(formData.get("file_url") ?? "").trim();

  if (!milestoneId) {
    redirect("/learner/projects?error=Select a milestone to submit evidence for.");
  }

  const { error } = await supabase.from("milestone_submissions").insert({
    milestone_id: milestoneId,
    learner_id: profile.id,
    content_text: contentText || null,
    file_url: fileUrl || null,
    status: "submitted"
  });

  if (error) redirect(`/learner/projects?error=${encodeURIComponent(error.message)}`);

  redirect("/learner/projects?message=Evidence submitted.");
}
