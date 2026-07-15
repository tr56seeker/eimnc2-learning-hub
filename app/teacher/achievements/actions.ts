"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";

const categories = [
  "lesson_completion",
  "competency_mastery",
  "timely_submission",
  "improved_performance",
  "project_completion",
  "safety_compliance",
  "consistent_participation",
  "remediation_completion",
  "enrichment_completion",
  "teacher_recognition"
] as const;

function revalidateAchievements() {
  revalidatePath("/teacher/achievements");
  revalidatePath("/learner/achievements");
}

export async function createAchievementAction(formData: FormData) {
  const { profile, supabase } = await requireTeacher();
  const name = String(formData.get("name") ?? "").trim();
  const categoryValue = String(formData.get("category") ?? "teacher_recognition");
  const category = categories.includes(categoryValue as (typeof categories)[number]) ? categoryValue : "teacher_recognition";

  if (!name) {
    redirect("/teacher/achievements?error=Achievement name is required.");
  }

  const { error } = await supabase.from("achievements").insert({
    name,
    description: String(formData.get("description") ?? "").trim() || null,
    icon: String(formData.get("icon") ?? "").trim() || "🏅",
    category,
    created_by: profile.id
  });

  if (error) redirect(`/teacher/achievements?error=${encodeURIComponent(error.message)}`);

  revalidateAchievements();
  redirect("/teacher/achievements?message=Achievement created.");
}

export async function awardAchievementAction(formData: FormData) {
  const { profile, supabase } = await requireTeacher();
  const achievementId = String(formData.get("achievement_id") ?? "");
  const learnerId = String(formData.get("learner_id") ?? "");
  const evidenceNote = String(formData.get("evidence_note") ?? "").trim() || null;

  if (!achievementId || !learnerId) {
    redirect("/teacher/achievements?error=Select both an achievement and a learner.");
  }

  const { error } = await supabase.from("learner_achievements").insert({
    achievement_id: achievementId,
    learner_id: learnerId,
    awarded_by: profile.id,
    evidence_note: evidenceNote
  });

  if (error) redirect(`/teacher/achievements?error=${encodeURIComponent(error.message)}`);

  revalidateAchievements();
  redirect("/teacher/achievements?message=Achievement awarded.");
}

export async function revokeAchievementAction(learnerAchievementId: string) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("learner_achievements").delete().eq("id", learnerAchievementId);

  if (error) redirect(`/teacher/achievements?error=${encodeURIComponent(error.message)}`);

  revalidateAchievements();
  redirect("/teacher/achievements?message=Achievement removed.");
}
