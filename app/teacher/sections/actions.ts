"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";

function sectionPayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const gradeLevel = Number(formData.get("grade_level") ?? 0);
  const schoolYear = String(formData.get("school_year") ?? "").trim();
  const isActive = formData.get("is_active") === "on";

  return { name, grade_level: gradeLevel, school_year: schoolYear, is_active: isActive };
}

export async function createSectionAction(formData: FormData) {
  const { supabase } = await requireTeacher();
  const payload = sectionPayload(formData);

  if (!payload.name || !payload.grade_level || !payload.school_year) {
    redirect("/teacher/sections?message=Section%20name%2C%20grade%20level%2C%20and%20school%20year%20are%20required");
  }

  const { error } = await supabase.from("sections").insert(payload);

  if (error) {
    redirect(`/teacher/sections?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/sections");
  revalidatePath("/teacher/learners");
  revalidatePath("/teacher/dashboard");
  redirect("/teacher/sections?message=Section%20created");
}

export async function updateSectionAction(sectionId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const payload = sectionPayload(formData);

  if (!payload.name || !payload.grade_level || !payload.school_year) {
    redirect("/teacher/sections?message=Section%20name%2C%20grade%20level%2C%20and%20school%20year%20are%20required");
  }

  const { error } = await supabase.from("sections").update(payload).eq("id", sectionId);

  if (error) {
    redirect(`/teacher/sections?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/sections");
  revalidatePath("/teacher/learners");
  revalidatePath("/teacher/dashboard");
  redirect("/teacher/sections?message=Section%20updated");
}
