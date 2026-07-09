"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import type { EditableAssessmentCategory } from "@/lib/gradebook";

type SaveGradebookPayload = {
  assessmentUpdates: Array<{ id: string; highestPossible: number | null }>;
  scoreUpdates: Array<{ assessmentId: string; learnerId: string; score: number | null }>;
};

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function sanitizeCategory(value: string): EditableAssessmentCategory {
  if (value === "written" || value === "performance" || value === "summative" || value === "term_exam") return value;
  return "written";
}

function gradebookPath(term: string, sectionId: string | null, view = "detail") {
  const params = new URLSearchParams({ term, view });
  if (sectionId) params.set("section_id", sectionId);
  return `/teacher/gradebook?${params.toString()}`;
}

export async function addGradebookAssessmentAction(formData: FormData) {
  const { supabase } = await requireTeacher();
  const term = String(formData.get("term") ?? "First Term");
  const sectionId = nullableText(formData.get("section_id"));
  const category = sanitizeCategory(String(formData.get("category") ?? "written"));

  const query = supabase
    .from("gradebook_assessments")
    .select("label, display_order")
    .eq("term", term)
    .eq("category", category);

  const { data: existing, error: existingError } = sectionId
    ? await query.eq("section_id", sectionId)
    : await query.is("section_id", null);

  if (existingError) {
    redirect(`${gradebookPath(term, sectionId)}&message=${encodeURIComponent(existingError.message)}`);
  }

  const existingRows = existing ?? [];
  const nextOrder = existingRows.reduce((max, row) => Math.max(max, Number(row.display_order ?? 0)), 0) + 1;
  const label =
    category === "summative"
      ? `SA${existingRows.filter((row) => String(row.label).startsWith("SA")).length + 1}`
      : String(existingRows.length + 1);

  const { error } = await supabase.from("gradebook_assessments").insert({
    term,
    category,
    label,
    highest_possible: 0,
    display_order: nextOrder,
    section_id: sectionId,
    is_active: true,
    updated_at: new Date().toISOString()
  });

  if (error) {
    redirect(`${gradebookPath(term, sectionId)}&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/gradebook");
  redirect(gradebookPath(term, sectionId));
}

export async function saveGradebookChangesAction(payload: SaveGradebookPayload) {
  const { supabase } = await requireTeacher();
  const now = new Date().toISOString();

  for (const assessment of payload.assessmentUpdates) {
    const { error } = await supabase
      .from("gradebook_assessments")
      .update({
        highest_possible: assessment.highestPossible ?? 0,
        updated_at: now
      })
      .eq("id", assessment.id);

    if (error) {
      return { ok: false, message: error.message };
    }
  }

  const scoreRows = payload.scoreUpdates.map((score) => ({
    assessment_id: score.assessmentId,
    learner_id: score.learnerId,
    score: score.score,
    updated_at: now
  }));

  if (scoreRows.length) {
    const { error } = await supabase
      .from("gradebook_scores")
      .upsert(scoreRows, { onConflict: "assessment_id,learner_id" });

    if (error) {
      return { ok: false, message: error.message };
    }
  }

  revalidatePath("/teacher/gradebook");
  return { ok: true, message: "Saved" };
}

export async function hideGradebookAssessmentAction(assessmentId: string) {
  const { supabase } = await requireTeacher();

  const { error } = await supabase
    .from("gradebook_assessments")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", assessmentId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/teacher/gradebook");
  return { ok: true, message: "Column hidden" };
}
