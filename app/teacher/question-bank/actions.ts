"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/auth";

const questionTypes = ["multiple_choice", "true_false", "identification", "essay"] as const;
const difficulties = ["easy", "average", "hots"] as const;

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalValue(formData: FormData, key: string) {
  const text = value(formData, key);
  return text ? text : null;
}

function choiceRows(formData: FormData, questionType: string) {
  if (questionType === "true_false") {
    return [
      { label: "True", value: "true" },
      { label: "False", value: "false" }
    ];
  }

  if (questionType !== "multiple_choice") return null;

  return value(formData, "choices")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [rawValue, ...labelParts] = line.split("|");
      const fallbackValue = String.fromCharCode(65 + index);
      const choiceValue = rawValue?.trim() || fallbackValue;
      const label = labelParts.join("|").trim() || rawValue?.trim() || choiceValue;

      return { label: label.startsWith(`${choiceValue}.`) ? label : `${choiceValue}. ${label}`, value: choiceValue };
    });
}

function questionPayload(formData: FormData, createdBy?: string) {
  const questionType = value(formData, "question_type");
  const difficulty = value(formData, "difficulty");

  if (!questionTypes.includes(questionType as (typeof questionTypes)[number])) {
    throw new Error("Unsupported question type.");
  }

  if (!difficulties.includes(difficulty as (typeof difficulties)[number])) {
    throw new Error("Unsupported difficulty.");
  }

  return {
    competency_id: optionalValue(formData, "competency_id"),
    question_text: value(formData, "question_text"),
    question_type: questionType,
    choices: choiceRows(formData, questionType),
    correct_answer: questionType === "essay" ? null : optionalValue(formData, "correct_answer"),
    points: Number(value(formData, "points") || 1),
    difficulty,
    explanation: optionalValue(formData, "explanation"),
    is_active: formData.get("is_active") === "on",
    ...(createdBy ? { created_by: createdBy } : {})
  };
}

export async function createQuestionAction(formData: FormData) {
  const { profile, supabase } = await requireTeacher();
  const { error } = await supabase.from("question_bank").insert(questionPayload(formData, profile.id));

  if (error) redirect(`/teacher/question-bank?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/teacher/question-bank");
  redirect("/teacher/question-bank?message=Question added.");
}

export async function updateQuestionAction(questionId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("question_bank").update(questionPayload(formData)).eq("id", questionId);

  if (error) redirect(`/teacher/question-bank?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/teacher/question-bank");
  redirect("/teacher/question-bank?message=Question updated.");
}

export async function deleteQuestionAction(questionId: string) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("question_bank").delete().eq("id", questionId);

  if (error) redirect(`/teacher/question-bank?message=${encodeURIComponent(error.message)}`);
  revalidatePath("/teacher/question-bank");
  redirect("/teacher/question-bank?message=Question deleted.");
}
