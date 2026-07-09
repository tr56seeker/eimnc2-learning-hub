"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { isLessonBlockType } from "@/lib/lesson-blocks";

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function blockPayload(formData: FormData) {
  const blockType = String(formData.get("block_type") ?? "paragraph");

  if (!isLessonBlockType(blockType)) {
    throw new Error("Unsupported lesson block type.");
  }

  return {
    block_type: blockType,
    title: nullableText(formData.get("title")),
    body: nullableText(formData.get("body")),
    image_url: nullableText(formData.get("image_url")),
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
    redirect(`/teacher/lessons/${lessonId}/studio?message=${encodeURIComponent(error instanceof Error ? error.message : "Invalid block")}`);
  }

  const { error } = await supabase.from("lesson_blocks").insert({
    lesson_id: lessonId,
    ...payload
  });

  if (error) {
    redirect(`/teacher/lessons/${lessonId}/studio?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/teacher/lessons/${lessonId}/studio`);
  revalidatePath(`/learner/lessons/${lessonId}`);
  redirect(`/teacher/lessons/${lessonId}/studio?message=Block%20added`);
}

export async function updateLessonBlockAction(lessonId: string, blockId: string, formData: FormData) {
  const { supabase } = await requireTeacher();

  let payload: ReturnType<typeof blockPayload>;
  try {
    payload = blockPayload(formData);
  } catch (error) {
    redirect(`/teacher/lessons/${lessonId}/studio?message=${encodeURIComponent(error instanceof Error ? error.message : "Invalid block")}`);
  }

  const { error } = await supabase
    .from("lesson_blocks")
    .update(payload)
    .eq("id", blockId)
    .eq("lesson_id", lessonId);

  if (error) {
    redirect(`/teacher/lessons/${lessonId}/studio?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/teacher/lessons/${lessonId}/studio`);
  revalidatePath(`/learner/lessons/${lessonId}`);
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
    redirect(`/teacher/lessons/${lessonId}/studio?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/teacher/lessons/${lessonId}/studio`);
  revalidatePath(`/learner/lessons/${lessonId}`);
  redirect(`/teacher/lessons/${lessonId}/studio?message=Block%20deleted`);
}
