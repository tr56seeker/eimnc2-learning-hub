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
