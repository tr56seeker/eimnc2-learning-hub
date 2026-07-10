"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";

function sectionPayload(formData: FormData) {
  const gradeLevel = Number(formData.get("grade_level") ?? 0);
  const name = String(formData.get("name") ?? "")
    .replace(/^grade\s+(?:11|12)\s*-\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const schoolYear = String(formData.get("school_year") ?? "").trim();
  const activeValue = String(formData.get("is_active") ?? "false");
  const isActive = activeValue === "on" || activeValue === "true";

  return { name, grade_level: gradeLevel, school_year: schoolYear, is_active: isActive };
}

async function sectionAlreadyExists(
  supabase: Awaited<ReturnType<typeof requireTeacher>>["supabase"],
  payload: ReturnType<typeof sectionPayload>,
  excludedId?: string
) {
  let query = supabase
    .from("sections")
    .select("id")
    .ilike("name", payload.name)
    .eq("grade_level", payload.grade_level)
    .eq("school_year", payload.school_year);

  if (excludedId) query = query.neq("id", excludedId);
  const { data } = await query.limit(1);
  return Boolean(data?.length);
}

function revalidateSectionConsumers() {
  revalidatePath("/teacher/sections");
  revalidatePath("/teacher/learners");
  revalidatePath("/teacher/gradebook");
  revalidatePath("/teacher/dashboard");
}

export async function createSectionAction(formData: FormData) {
  const { supabase } = await requireTeacher();
  const payload = sectionPayload(formData);

  if (!payload.name || !payload.grade_level || !payload.school_year) {
    redirect("/teacher/sections?message=Section%20name%2C%20grade%20level%2C%20and%20school%20year%20are%20required");
  }

  if (![11, 12].includes(payload.grade_level)) {
    redirect("/teacher/sections?message=Grade%20level%20must%20be%2011%20or%2012");
  }

  if (await sectionAlreadyExists(supabase, payload)) {
    redirect("/teacher/sections?message=This%20section%20already%20exists.");
  }

  const { error } = await supabase.from("sections").insert(payload);

  if (error) {
    redirect(`/teacher/sections?message=${encodeURIComponent(error.message)}`);
  }

  revalidateSectionConsumers();
  redirect("/teacher/sections?message=Section%20created");
}

export async function updateSectionAction(sectionId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const payload = sectionPayload(formData);

  if (!payload.name || !payload.grade_level || !payload.school_year) {
    redirect("/teacher/sections?message=Section%20name%2C%20grade%20level%2C%20and%20school%20year%20are%20required");
  }

  if (![11, 12].includes(payload.grade_level)) {
    redirect("/teacher/sections?message=Grade%20level%20must%20be%2011%20or%2012");
  }

  if (await sectionAlreadyExists(supabase, payload, sectionId)) {
    redirect("/teacher/sections?message=This%20section%20already%20exists.");
  }

  const { error } = await supabase.from("sections").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", sectionId);

  if (error) {
    redirect(`/teacher/sections?message=${encodeURIComponent(error.message)}`);
  }

  revalidateSectionConsumers();
  redirect("/teacher/sections?message=Section%20updated");
}

export async function removeSectionAction(sectionId: string) {
  const { supabase } = await requireTeacher();
  const { count, error: countError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "learner")
    .eq("section_id", sectionId)
    .or("status.is.null,status.neq.deleted");

  if (countError) redirect(`/teacher/sections?message=${encodeURIComponent(countError.message)}`);

  if ((count ?? 0) > 0) {
    const { error } = await supabase
      .from("sections")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", sectionId);
    if (error) redirect(`/teacher/sections?message=${encodeURIComponent(error.message)}`);
    revalidateSectionConsumers();
    redirect("/teacher/sections?message=This%20section%20has%20assigned%20learners.%20It%20was%20deactivated%20instead%20of%20permanently%20deleted.");
  }

  const { error } = await supabase.from("sections").delete().eq("id", sectionId);
  if (error) redirect(`/teacher/sections?message=${encodeURIComponent(error.message)}`);
  revalidateSectionConsumers();
  redirect("/teacher/sections?message=Section%20removed");
}
