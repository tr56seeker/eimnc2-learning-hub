"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function competencyPayload(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = nullableText(formData.get("description"));
  const gradeLevelRaw = String(formData.get("grade_level") ?? "").trim();
  const gradeLevel = gradeLevelRaw ? Number(gradeLevelRaw) : null;

  return {
    code,
    title,
    description,
    grade_level: gradeLevel !== null && Number.isFinite(gradeLevel) ? gradeLevel : null
  };
}

function revalidateCompetencyConsumers() {
  revalidatePath("/teacher/competencies");
  revalidatePath("/teacher/lessons");
  revalidatePath("/teacher/exams");
  revalidatePath("/teacher/question-bank");
  revalidatePath("/teacher/projects");
}

export async function createCompetencyAction(formData: FormData) {
  const { profile, supabase } = await requireTeacher();
  const payload = competencyPayload(formData);

  if (!payload.code || !payload.title) {
    redirect("/teacher/competencies?error=Code%20and%20title%20are%20required.");
  }

  const { count } = await supabase
    .from("competencies")
    .select("id", { count: "exact", head: true })
    .order("order_index", { ascending: false })
    .limit(1);

  const { data: created, error } = await supabase
    .from("competencies")
    .insert({ ...payload, order_index: count ?? 0 })
    .select("id")
    .single();

  if (error) {
    redirect(`/teacher/competencies?error=${encodeURIComponent(error.message)}`);
  }

  revalidateCompetencyConsumers();
  await logActivity(supabase, profile.id, "competency.created", { competency_id: created?.id, code: payload.code });

  redirect("/teacher/competencies?message=Competency%20created.");
}

export async function updateCompetencyAction(competencyId: string, formData: FormData) {
  const { profile, supabase } = await requireTeacher();
  const payload = competencyPayload(formData);

  if (!payload.code || !payload.title) {
    redirect("/teacher/competencies?error=Code%20and%20title%20are%20required.");
  }

  const { error } = await supabase.from("competencies").update(payload).eq("id", competencyId);

  if (error) {
    redirect(`/teacher/competencies?error=${encodeURIComponent(error.message)}`);
  }

  revalidateCompetencyConsumers();
  await logActivity(supabase, profile.id, "competency.updated", { competency_id: competencyId, code: payload.code });

  redirect("/teacher/competencies?message=Competency%20updated.");
}

export async function setCompetencyActiveAction(competencyId: string, isActive: boolean) {
  const { profile, supabase } = await requireTeacher();

  const { error } = await supabase.from("competencies").update({ is_active: isActive }).eq("id", competencyId);

  if (error) {
    redirect(`/teacher/competencies?error=${encodeURIComponent(error.message)}`);
  }

  revalidateCompetencyConsumers();
  await logActivity(supabase, profile.id, isActive ? "competency.restored" : "competency.archived", { competency_id: competencyId });

  redirect(`/teacher/competencies?message=${encodeURIComponent(isActive ? "Competency restored." : "Competency archived.")}`);
}

export async function moveCompetencyAction(competencyId: string, direction: "up" | "down") {
  const { supabase } = await requireTeacher();

  const { data: all, error } = await supabase
    .from("competencies")
    .select("id, order_index")
    .order("order_index", { ascending: true });

  if (error || !all) {
    redirect(`/teacher/competencies?error=${encodeURIComponent(error?.message ?? "Unable to reorder.")}`);
  }

  const index = all.findIndex((row) => row.id === competencyId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapIndex < 0 || swapIndex >= all.length) {
    redirect("/teacher/competencies");
  }

  const current = all[index];
  const swapWith = all[swapIndex];

  const [{ error: error1 }, { error: error2 }] = await Promise.all([
    supabase.from("competencies").update({ order_index: swapWith.order_index }).eq("id", current.id),
    supabase.from("competencies").update({ order_index: current.order_index }).eq("id", swapWith.id)
  ]);

  if (error1 || error2) {
    redirect(`/teacher/competencies?error=${encodeURIComponent((error1 ?? error2)?.message ?? "Unable to reorder.")}`);
  }

  revalidateCompetencyConsumers();
  redirect("/teacher/competencies?message=Order%20updated.");
}
