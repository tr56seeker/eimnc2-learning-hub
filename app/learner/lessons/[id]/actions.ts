"use server";

import { revalidatePath } from "next/cache";
import { requireLearner } from "@/lib/auth";

export async function markLessonCompleteAction(lessonId: string) {
  const { profile, supabase } = await requireLearner();

  await supabase.from("lesson_progress").upsert(
    {
      learner_id: profile.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { onConflict: "learner_id,lesson_id" }
  );

  revalidatePath(`/learner/lessons/${lessonId}`);
  revalidatePath("/learner/lessons");
}

export async function updateLessonSectionProgressAction(lessonId: string, sectionId: string) {
  const { profile, supabase } = await requireLearner();

  await supabase.from("lesson_progress").upsert(
    {
      learner_id: profile.id,
      lesson_id: lessonId,
      last_section: sectionId,
      updated_at: new Date().toISOString()
    },
    { onConflict: "learner_id,lesson_id" }
  );
}

// Called as a learner checks off a checklist item, marks an activity done, or
// submits a quick-question/reflection response. `response` is opaque here —
// each interactive block type decides its own shape (see LessonBlockProgress)
// and computes `completed` itself before calling this, so this action stays
// generic instead of needing a branch per block type.
export async function saveLessonBlockProgressAction(
  blockId: string,
  lessonId: string,
  completed: boolean,
  response: { text?: string; checked?: boolean[] } | null
) {
  const { profile, supabase } = await requireLearner();

  await supabase.from("lesson_block_progress").upsert(
    {
      learner_id: profile.id,
      block_id: blockId,
      lesson_id: lessonId,
      completed,
      response,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "learner_id,block_id" }
  );

  revalidatePath(`/learner/lessons/${lessonId}`);
}
