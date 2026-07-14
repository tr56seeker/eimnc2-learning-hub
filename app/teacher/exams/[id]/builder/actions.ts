"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";

function builderPath(examId: string) {
  return `/teacher/exams/${examId}/builder`;
}

export async function addExamQuestionAction(examId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const questionId = String(formData.get("question_id") ?? "");

  if (!questionId) redirect(`${builderPath(examId)}?error=Select a question first.`);

  const { count } = await supabase
    .from("exam_questions")
    .select("id", { count: "exact", head: true })
    .eq("exam_id", examId);

  const { error } = await supabase.from("exam_questions").insert({
    exam_id: examId,
    question_id: questionId,
    order_index: count ?? 0
  });

  if (error) redirect(`${builderPath(examId)}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(builderPath(examId));
  redirect(`${builderPath(examId)}?message=Question added to exam.`);
}

export async function updateExamQuestionAction(examId: string, examQuestionId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const orderIndex = Number(String(formData.get("order_index") ?? "0"));
  const pointsValue = String(formData.get("points_override") ?? "").trim();

  const { error } = await supabase
    .from("exam_questions")
    .update({
      order_index: Number.isFinite(orderIndex) ? orderIndex : 0,
      points_override: pointsValue ? Number(pointsValue) : null
    })
    .eq("id", examQuestionId)
    .eq("exam_id", examId);

  if (error) redirect(`${builderPath(examId)}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(builderPath(examId));
  redirect(`${builderPath(examId)}?message=Exam question updated.`);
}

export async function removeExamQuestionAction(examId: string, examQuestionId: string) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase
    .from("exam_questions")
    .delete()
    .eq("id", examQuestionId)
    .eq("exam_id", examId);

  if (error) redirect(`${builderPath(examId)}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(builderPath(examId));
  redirect(`${builderPath(examId)}?message=Question removed from exam.`);
}
