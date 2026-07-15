"use server";

import { redirect } from "next/navigation";
import { requireLearner } from "@/lib/auth";
import { resolveFilenamePattern } from "@/lib/filename-pattern";

export async function submitOutputAction(formData: FormData) {
  const { profile, supabase } = await requireLearner();
  const assignmentId = String(formData.get("assignment_id") ?? "");
  const contentText = String(formData.get("content_text") ?? "").trim();
  const fileUrl = String(formData.get("file_url") ?? "").trim();

  if (!assignmentId) {
    redirect("/learner/submissions?error=Please select an assignment.");
  }

  const [{ data: assignment }, { count: priorCount }, { data: section }] = await Promise.all([
    supabase.from("assignments").select("title, expected_filename_pattern").eq("id", assignmentId).maybeSingle(),
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("assignment_id", assignmentId)
      .eq("learner_id", profile.id),
    profile.section_id
      ? supabase.from("sections").select("name").eq("id", profile.section_id).maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  const submittedFilename = assignment?.expected_filename_pattern
    ? resolveFilenamePattern(assignment.expected_filename_pattern, {
        lrn: profile.lrn,
        firstName: profile.first_name,
        lastName: profile.last_name,
        fullName: profile.full_name,
        section: section?.name ?? null,
        activityTitle: assignment.title,
        version: (priorCount ?? 0) + 1
      })
    : null;

  const { error } = await supabase.from("submissions").insert({
    assignment_id: assignmentId,
    learner_id: profile.id,
    content_text: contentText || null,
    file_url: fileUrl || null,
    submitted_filename: submittedFilename,
    status: "submitted"
  });

  if (error) {
    redirect(`/learner/submissions?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/learner/submissions?message=Output submitted successfully.");
}
