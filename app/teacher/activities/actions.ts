"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";

const submissionTypes = ["link_or_text", "text_only", "file_link", "image_link", "video_link"] as const;

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseRubric(raw: string) {
  const criteria = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, pointsRaw] = line.split("|").map((part) => part.trim());
      const points = Number(pointsRaw);
      return { name: name || "Criterion", points: Number.isFinite(points) ? points : 0 };
    });

  return criteria.length ? { criteria } : null;
}

function activityPayload(formData: FormData, createdBy?: string) {
  const title = String(formData.get("title") ?? "").trim();
  const instructions = nullableText(formData.get("instructions"));
  const lessonId = nullableText(formData.get("lesson_id"));
  const dueAtValue = String(formData.get("due_at") ?? "").trim();
  const dueAt = dueAtValue ? new Date(dueAtValue).toISOString() : null;
  const maxScore = Number(formData.get("max_score") ?? 100);
  const submissionTypeValue = String(formData.get("submission_type") ?? "link_or_text");
  const submissionType = submissionTypes.includes(submissionTypeValue as (typeof submissionTypes)[number])
    ? submissionTypeValue
    : "link_or_text";
  const rubric = parseRubric(String(formData.get("rubric") ?? ""));
  const expectedFilenamePattern = nullableText(formData.get("expected_filename_pattern"));

  return {
    title,
    instructions,
    lesson_id: lessonId,
    due_at: dueAt,
    max_score: Number.isFinite(maxScore) && maxScore > 0 ? maxScore : 100,
    submission_type: submissionType,
    rubric,
    expected_filename_pattern: expectedFilenamePattern,
    ...(createdBy ? { created_by: createdBy } : {})
  };
}

function revalidateActivityPaths() {
  revalidatePath("/teacher/activities");
  revalidatePath("/teacher/submissions");
  revalidatePath("/learner/submissions");
}

export async function createActivityAction(formData: FormData) {
  const { profile, supabase } = await requireTeacher();
  const payload = activityPayload(formData, profile.id);

  if (!payload.title) {
    redirect("/teacher/activities?error=Activity title is required.");
  }

  const { error } = await supabase.from("assignments").insert(payload);

  if (error) redirect(`/teacher/activities?error=${encodeURIComponent(error.message)}`);

  revalidateActivityPaths();
  redirect("/teacher/activities?message=Activity created.");
}

export async function updateActivityAction(activityId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const payload = activityPayload(formData);

  if (!payload.title) {
    redirect("/teacher/activities?error=Activity title is required.");
  }

  const { error } = await supabase.from("assignments").update(payload).eq("id", activityId);

  if (error) redirect(`/teacher/activities?error=${encodeURIComponent(error.message)}`);

  revalidateActivityPaths();
  redirect("/teacher/activities?message=Activity updated.");
}

export async function setActivityActiveAction(activityId: string, isActive: boolean) {
  const { supabase } = await requireTeacher();

  const { error } = await supabase.from("assignments").update({ is_active: isActive }).eq("id", activityId);

  if (error) redirect(`/teacher/activities?error=${encodeURIComponent(error.message)}`);

  revalidateActivityPaths();
  redirect(`/teacher/activities?message=${encodeURIComponent(isActive ? "Activity restored." : "Activity archived.")}`);
}
