"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireTeacher } from "@/lib/auth";
import { extractEmbedSrc, isLessonBlockType } from "@/lib/lesson-blocks";

type LessonSnapshot = {
  lesson: {
    title: string;
    summary: string | null;
    estimated_minutes: number | null;
    competency_id: string | null;
  };
  blocks: Array<{
    block_type: string;
    title: string | null;
    body: string | null;
    image_url: string | null;
    caption: string | null;
    alt_text: string | null;
    metadata: Record<string, unknown> | null;
    display_order: number | null;
    is_active: boolean | null;
  }>;
};

async function snapshotLessonVersion(supabase: SupabaseClient, lessonId: string, createdBy: string) {
  const [{ data: lessonData }, { data: blocksData }] = await Promise.all([
    supabase.from("lessons").select("title, summary, estimated_minutes, competency_id").eq("id", lessonId).single(),
    supabase
      .from("lesson_blocks")
      .select("block_type, title, body, image_url, caption, alt_text, metadata, display_order, is_active")
      .eq("lesson_id", lessonId)
      .order("display_order")
  ]);

  if (!lessonData) return;

  const snapshot: LessonSnapshot = { lesson: lessonData, blocks: blocksData ?? [] };

  await supabase.from("lesson_versions").insert({
    lesson_id: lessonId,
    created_by: createdBy,
    snapshot
  });
}

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
  const { profile, supabase } = await requireTeacher();
  const { error } = await supabase.from("lessons").update({ published, scheduled_publish_at: null }).eq("id", lessonId);

  if (error) {
    redirect(studioPath(lessonId, error.message, "error"));
  }

  if (published) {
    await snapshotLessonVersion(supabase, lessonId, profile.id);
  }

  revalidateLessonPaths(lessonId);
  redirect(studioPath(lessonId, published ? "Lesson published successfully." : "Lesson moved back to draft."));
}

export async function restoreLessonVersionAction(lessonId: string, versionId: string) {
  const { supabase } = await requireTeacher();

  const { data: version, error: versionError } = await supabase
    .from("lesson_versions")
    .select("snapshot")
    .eq("id", versionId)
    .eq("lesson_id", lessonId)
    .maybeSingle<{ snapshot: LessonSnapshot }>();

  if (versionError || !version) {
    redirect(studioPath(lessonId, "That version could not be found.", "error"));
  }

  const { lesson: lessonSnapshot, blocks: blockSnapshots } = version.snapshot;

  const { error: lessonUpdateError } = await supabase.from("lessons").update(lessonSnapshot).eq("id", lessonId);
  if (lessonUpdateError) {
    redirect(studioPath(lessonId, lessonUpdateError.message, "error"));
  }

  const { error: deleteError } = await supabase.from("lesson_blocks").delete().eq("lesson_id", lessonId);
  if (deleteError) {
    redirect(studioPath(lessonId, deleteError.message, "error"));
  }

  if (blockSnapshots.length) {
    const { error: insertError } = await supabase
      .from("lesson_blocks")
      .insert(blockSnapshots.map((block) => ({ ...block, lesson_id: lessonId })));

    if (insertError) {
      redirect(studioPath(lessonId, insertError.message, "error"));
    }
  }

  revalidateLessonPaths(lessonId);
  redirect(studioPath(lessonId, "Restored an earlier version. Review and publish again when ready."));
}

export async function scheduleLessonPublishAction(lessonId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const scheduledValue = String(formData.get("scheduled_publish_at") ?? "").trim();

  if (!scheduledValue) {
    redirect(studioPath(lessonId, "Choose a date and time to schedule.", "error"));
  }

  const scheduledDate = new Date(scheduledValue);
  if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
    redirect(studioPath(lessonId, "Scheduled time must be in the future.", "error"));
  }

  const { error } = await supabase
    .from("lessons")
    .update({ scheduled_publish_at: scheduledDate.toISOString(), published: false })
    .eq("id", lessonId);

  if (error) {
    redirect(studioPath(lessonId, error.message, "error"));
  }

  revalidateLessonPaths(lessonId);
  redirect(
    studioPath(
      lessonId,
      `Lesson scheduled to publish on ${scheduledDate.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}.`
    )
  );
}

export async function cancelScheduledLessonPublishAction(lessonId: string) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("lessons").update({ scheduled_publish_at: null }).eq("id", lessonId);

  if (error) {
    redirect(studioPath(lessonId, error.message, "error"));
  }

  revalidateLessonPaths(lessonId);
  redirect(studioPath(lessonId, "Scheduled publish canceled."));
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

export async function reorderLessonBlocksAction(lessonId: string, orderedBlockIds: string[]) {
  const { supabase } = await requireTeacher();

  await Promise.all(
    orderedBlockIds.map((blockId, index) =>
      supabase.from("lesson_blocks").update({ display_order: index }).eq("id", blockId).eq("lesson_id", lessonId)
    )
  );

  revalidateLessonPaths(lessonId);
}
