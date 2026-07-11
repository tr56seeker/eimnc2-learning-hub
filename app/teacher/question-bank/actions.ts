"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/auth";
import { createBulkQuestionRow, validateBulkQuestionRows, type BulkQuestionColumn } from "./bulk-upload";

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

export type BulkImportSummary = {
  ok: boolean;
  message: string;
  total: number;
  imported: number;
  skipped: number;
  errors: number;
};

export async function bulkImportQuestionsAction(formData: FormData): Promise<BulkImportSummary> {
  const { profile, supabase } = await requireTeacher();
  const includeDuplicates = formData.get("include_duplicates") === "true";
  let rawRows: unknown;

  try {
    rawRows = JSON.parse(String(formData.get("rows") ?? "[]"));
  } catch {
    return { ok: false, message: "The uploaded question data could not be read.", total: 0, imported: 0, skipped: 0, errors: 1 };
  }

  if (!Array.isArray(rawRows) || !rawRows.length) {
    return { ok: false, message: "No question rows were provided.", total: 0, imported: 0, skipped: 0, errors: 1 };
  }

  if (rawRows.length > 1000) {
    return { ok: false, message: "A bulk upload can contain at most 1,000 rows.", total: rawRows.length, imported: 0, skipped: rawRows.length, errors: rawRows.length };
  }

  const rows = rawRows.map((rawRow, index) => {
    const record = rawRow && typeof rawRow === "object" ? rawRow as Record<string, unknown> : {};
    return createBulkQuestionRow(record as Partial<Record<BulkQuestionColumn, unknown>>, Number(record.sourceRow) || index + 2);
  });

  const [competenciesResult, existingQuestionsResult] = await Promise.all([
    supabase.from("competencies").select("id, code"),
    supabase.from("question_bank").select("competency_id, question_text, question_type")
  ]);

  if (competenciesResult.error || existingQuestionsResult.error) {
    const message = competenciesResult.error?.message ?? existingQuestionsResult.error?.message ?? "Unable to validate questions.";
    return { ok: false, message, total: rows.length, imported: 0, skipped: rows.length, errors: rows.length };
  }

  const competencies = (competenciesResult.data ?? []).flatMap((competency) =>
    competency.code ? [{ id: competency.id, code: competency.code }] : []
  );
  const existingQuestions = (existingQuestionsResult.data ?? []).map((question) => ({
    competencyId: question.competency_id,
    questionText: question.question_text,
    questionType: question.question_type
  }));
  const validated = validateBulkQuestionRows(rows, competencies, existingQuestions);
  const invalidCount = validated.filter((row) => row.status === "error").length;
  const candidates = validated.filter((row) => row.payload && (row.status === "valid" || (includeDuplicates && row.status === "duplicate")));
  const payloads = candidates.flatMap((row) => row.payload ? [{
    competency_id: row.payload.competencyId,
    question_type: row.payload.questionType,
    difficulty: row.payload.difficulty,
    question_text: row.payload.questionText,
    choices: row.payload.choices,
    correct_answer: row.payload.correctAnswer,
    points: row.payload.points,
    explanation: row.payload.explanation,
    is_active: row.payload.isActive,
    created_by: profile.id
  }] : []);

  if (!payloads.length) {
    return {
      ok: false,
      message: "No valid questions are available to import.",
      total: rows.length,
      imported: 0,
      skipped: rows.length,
      errors: invalidCount
    };
  }

  const { error } = await supabase.from("question_bank").insert(payloads);
  if (error) {
    return {
      ok: false,
      message: error.message,
      total: rows.length,
      imported: 0,
      skipped: rows.length,
      errors: invalidCount + payloads.length
    };
  }

  revalidatePath("/teacher/question-bank");
  return {
    ok: true,
    message: `${payloads.length} question${payloads.length === 1 ? "" : "s"} imported successfully.`,
    total: rows.length,
    imported: payloads.length,
    skipped: rows.length - payloads.length,
    errors: invalidCount
  };
}
