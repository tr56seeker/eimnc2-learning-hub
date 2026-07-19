"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalValue(formData: FormData, key: string) {
  const text = value(formData, key);
  return text ? text : null;
}

function dateValue(formData: FormData, key: string) {
  const text = value(formData, key);
  return text ? new Date(text).toISOString() : null;
}

function examPayload(formData: FormData, createdBy?: string) {
  const isPublished = formData.get("is_published") === "on";
  const showResult = formData.get("show_result_after_submit") === "on";

  return {
    competency_id: optionalValue(formData, "competency_id"),
    lesson_id: optionalValue(formData, "lesson_id"),
    title: value(formData, "title"),
    description: optionalValue(formData, "description"),
    duration_minutes: Number(value(formData, "duration_minutes") || 30),
    start_at: dateValue(formData, "start_at"),
    end_at: dateValue(formData, "end_at"),
    randomize_questions: formData.get("randomize_questions") === "on",
    randomize_choices: formData.get("randomize_choices") === "on",
    show_result_after_submit: showResult,
    show_score_after_submit: showResult,
    allow_review_after_close: formData.get("allow_review_after_close") === "on",
    max_violations: Math.min(5, Math.max(1, Number(value(formData, "max_violations") || 3))),
    status: isPublished ? "published" : "draft",
    ...(createdBy ? { created_by: createdBy } : {})
  };
}

export async function createExamAction(formData: FormData) {
  const { profile, supabase } = await requireTeacher();
  const { error } = await supabase.from("exams").insert(examPayload(formData, profile.id));

  if (error) redirect(`/teacher/exams?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/teacher/exams");
  redirect("/teacher/exams?message=Exam created.");
}

export async function updateExamAction(examId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("exams").update(examPayload(formData)).eq("id", examId);

  if (error) redirect(`/teacher/exams?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/teacher/exams");
  revalidatePath(`/teacher/exams/${examId}/builder`);
  redirect("/teacher/exams?message=Exam updated.");
}

export async function setExamStatusAction(examId: string, status: "draft" | "published" | "closed") {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("exams").update({ status }).eq("id", examId);

  if (error) redirect(`/teacher/exams?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/teacher/exams");
  redirect(`/teacher/exams?message=Exam ${status === "published" ? "published" : "unpublished"}.`);
}

export async function deleteExamAction(examId: string) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("exams").delete().eq("id", examId);

  if (error) redirect(`/teacher/exams?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/teacher/exams");
  redirect("/teacher/exams?message=Exam deleted.");
}
