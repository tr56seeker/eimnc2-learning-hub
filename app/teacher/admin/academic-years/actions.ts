"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function createAcademicYearAction(formData: FormData) {
  const { profile, supabase } = await requireAdmin();

  const yearLabel = String(formData.get("year_label") ?? "").trim();
  const startDate = nullableText(formData.get("start_date"));
  const endDate = nullableText(formData.get("end_date"));

  if (!yearLabel) {
    redirect("/teacher/admin/academic-years?error=School%20year%20label%20is%20required.");
  }

  const { data, error } = await supabase
    .from("academic_years")
    .insert({ year_label: yearLabel, start_date: startDate, end_date: endDate })
    .select("id")
    .single();

  if (error) {
    redirect(`/teacher/admin/academic-years?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/admin/academic-years");
  await logActivity(supabase, profile.id, "academic_year.created", { academic_year_id: data?.id, year_label: yearLabel });

  redirect("/teacher/admin/academic-years?message=School%20year%20created");
}

export async function setCurrentAcademicYearAction(academicYearId: string) {
  const { profile, supabase } = await requireAdmin();

  const { error: clearError } = await supabase.from("academic_years").update({ is_current: false }).neq("id", academicYearId);
  if (clearError) redirect(`/teacher/admin/academic-years?error=${encodeURIComponent(clearError.message)}`);

  const { error } = await supabase
    .from("academic_years")
    .update({ is_current: true, updated_at: new Date().toISOString() })
    .eq("id", academicYearId);

  if (error) {
    redirect(`/teacher/admin/academic-years?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/admin/academic-years");
  await logActivity(supabase, profile.id, "academic_year.set_current", { academic_year_id: academicYearId });

  redirect("/teacher/admin/academic-years?message=Current%20school%20year%20updated");
}

export async function createTermAction(formData: FormData) {
  const { profile, supabase } = await requireAdmin();

  const academicYearId = String(formData.get("academic_year_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const startDate = nullableText(formData.get("start_date"));
  const endDate = nullableText(formData.get("end_date"));

  if (!academicYearId || !name) {
    redirect("/teacher/admin/academic-years?error=Term%20name%20and%20school%20year%20are%20required.");
  }

  const { count } = await supabase
    .from("terms")
    .select("id", { count: "exact", head: true })
    .eq("academic_year_id", academicYearId);

  const { data, error } = await supabase
    .from("terms")
    .insert({ academic_year_id: academicYearId, name, order_index: count ?? 0, start_date: startDate, end_date: endDate })
    .select("id")
    .single();

  if (error) {
    redirect(`/teacher/admin/academic-years?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/admin/academic-years");
  await logActivity(supabase, profile.id, "term.created", { term_id: data?.id, name, academic_year_id: academicYearId });

  redirect("/teacher/admin/academic-years?message=Term%20created");
}

export async function setCurrentTermAction(termId: string) {
  const { profile, supabase } = await requireAdmin();

  const { error: clearError } = await supabase.from("terms").update({ is_current: false }).neq("id", termId);
  if (clearError) redirect(`/teacher/admin/academic-years?error=${encodeURIComponent(clearError.message)}`);

  const { error } = await supabase.from("terms").update({ is_current: true, updated_at: new Date().toISOString() }).eq("id", termId);

  if (error) {
    redirect(`/teacher/admin/academic-years?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/admin/academic-years");
  await logActivity(supabase, profile.id, "term.set_current", { term_id: termId });

  redirect("/teacher/admin/academic-years?message=Current%20term%20updated");
}
