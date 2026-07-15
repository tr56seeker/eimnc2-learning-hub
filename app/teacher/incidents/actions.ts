"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";

const reviewStatuses = [
  "needs_review",
  "no_concern",
  "technical_issue",
  "clarification_required",
  "possible_violation",
  "resolved",
  "escalated"
] as const;

export async function setIncidentReviewAction(attemptId: string, formData: FormData) {
  const { profile, supabase } = await requireTeacher();
  const statusValue = String(formData.get("status") ?? "needs_review");
  const status = reviewStatuses.includes(statusValue as (typeof reviewStatuses)[number]) ? statusValue : "needs_review";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase.from("exam_incident_reviews").upsert(
    {
      attempt_id: attemptId,
      status,
      notes,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { onConflict: "attempt_id" }
  );

  if (error) redirect(`/teacher/incidents?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/teacher/incidents");
  revalidatePath("/teacher/dashboard");
  redirect("/teacher/incidents?message=Incident updated.");
}
