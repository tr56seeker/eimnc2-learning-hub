"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { extractEmbedSrc, isLessonBlockType } from "@/lib/lesson-blocks";

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function studioPath(lessonId: string, message: string, variant: "message" | "error" = "message") {
  return `/teacher/lessons/${lessonId}/studio?${variant}=${encodeURIComponent(message)}`;
}

function revalidateLessonPaths(lessonId: string) {
  revalidatePath("/teacher/lessons");
  revalidatePath(`/teacher/lessons/${lessonId}/studio`);
  revalidatePath("/learner/lessons");
  revalidatePath(`/learner/lessons/${lessonId}`);
}

export async function setLessonPublishedAction(lessonId: string, published: boolean) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("lessons").update({ published }).eq("id", lessonId);

  if (error) {
    redirect(studioPath(lessonId, error.message, "error"));
  }

  revalidateLessonPaths(lessonId);
  redirect(studioPath(lessonId, published ? "Lesson published successfully." : "Lesson moved back to draft."));
}

export async function updateLessonInfoAction(lessonId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const title = String(formData.get("title") ?? "").trim();
  const summary = nullableText(formData.get("summary"));
  const competencyId = nullableText(formData.get("competency_id"));
  const submittedMinutes = Number(formData.get("estimated_minutes") ?? 45);
  const estimatedMinutes = Number.isFinite(submittedMinutes) && submittedMinutes > 0 ? Math.round(submittedMinutes) : 45;

  if (!title) {
    redirect(studioPath(lessonId, "Lesson title is required.", "error"));
  }

  const { error } = await supabase
    .from("lessons")
    .update({
      title,
      summary,
      competency_id: competencyId,
      estimated_minutes: estimatedMinutes
    })
    .eq("id", lessonId);

  if (error) {
    redirect(studioPath(lessonId, error.message, "error"));
  }

  revalidateLessonPaths(lessonId);
  redirect(studioPath(lessonId, "Lesson information updated."));
}

function blockPayload(formData: FormData) {
  const blockType = String(formData.get("block_type") ?? "paragraph");

  if (!isLessonBlockType(blockType)) {
    throw new Error("Unsupported lesson block type.");
  }

  const submittedUrl = String(formData.get("image_url") ?? "");
  const extractsIframeSrc = blockType === "embed" || blockType === "video" || blockType === "module" || blockType === "module_pdf";

  return {
    block_type: blockType,
    title: nullableText(formData.get("title")),
    body: nullableText(formData.get("body")),
    image_url: extractsIframeSrc ? extractEmbedSrc(submittedUrl) || null : nullableText(submittedUrl),
    caption: nullableText(formData.get("caption")),
    alt_text: nullableText(formData.get("alt_text")),
    metadata: {},
    display_order: Number(formData.get("display_order") ?? 0),
    is_active: formData.get("is_active") === "on",
    updated_at: new Date().toISOString()
  };
}

export async function createLessonBlockAction(lessonId: string, formData: FormData) {
  const { supabase } = await requireTeacher();

  let payload: ReturnType<typeof blockPayload>;
  try {
    payload = blockPayload(formData);
  } catch (error) {
    redirect(`/teacher/lessons/${lessonId}/studio?error=${encodeURIComponent(error instanceof Error ? error.message : "Invalid block")}`);
  }

  const { error } = await supabase.from("lesson_blocks").insert({
    lesson_id: lessonId,
    ...payload
  });

  if (error) {
    redirect(`/teacher/lessons/${lessonId}/studio?error=${encodeURIComponent(error.message)}`);
  }

  revalidateLessonPaths(lessonId);
  redirect(`/teacher/lessons/${lessonId}/studio?message=Block%20added`);
}

export async function updateLessonBlockAction(lessonId: string, blockId: string, formData: FormData) {
  const { supabase } = await requireTeacher();

  let payload: ReturnType<typeof blockPayload>;
  try {
    payload = blockPayload(formData);
  } catch (error) {
    redirect(`/teacher/lessons/${lessonId}/studio?error=${encodeURIComponent(error instanceof Error ? error.message : "Invalid block")}`);
  }

  const { error } = await supabase
    .from("lesson_blocks")
    .update(payload)
    .eq("id", blockId)
    .eq("lesson_id", lessonId);

  if (error) {
    redirect(`/teacher/lessons/${lessonId}/studio?error=${encodeURIComponent(error.message)}`);
  }

  revalidateLessonPaths(lessonId);
  redirect(`/teacher/lessons/${lessonId}/studio?message=Block%20updated`);
}

export async function deleteLessonBlockAction(lessonId: string, blockId: string) {
  const { supabase } = await requireTeacher();

  const { error } = await supabase
    .from("lesson_blocks")
    .delete()
    .eq("id", blockId)
    .eq("lesson_id", lessonId);

  if (error) {
    redirect(`/teacher/lessons/${lessonId}/studio?error=${encodeURIComponent(error.message)}`);
  }

  revalidateLessonPaths(lessonId);
  redirect(`/teacher/lessons/${lessonId}/studio?message=Block%20deleted`);
}
