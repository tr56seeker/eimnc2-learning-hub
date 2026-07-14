"use server";

import { redirect } from "next/navigation";
import { requireLearner } from "@/lib/auth";

export async function submitOutputAction(formData: FormData) {
  const { profile, supabase } = await requireLearner();
  const assignmentId = String(formData.get("assignment_id") ?? "");
  const contentText = String(formData.get("content_text") ?? "").trim();
  const fileUrl = String(formData.get("file_url") ?? "").trim();

  if (!assignmentId) {
    redirect("/learner/submissions?error=Please select an assignment.");
  }

  const { error } = await supabase.from("submissions").insert({
    assignment_id: assignmentId,
    learner_id: profile.id,
    content_text: contentText || null,
    file_url: fileUrl || null,
    status: "submitted"
  });

  if (error) {
    redirect(`/learner/submissions?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/learner/submissions?message=Output submitted successfully.");
}
