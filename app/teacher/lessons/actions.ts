"use server";

import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";

export async function createLessonAction(formData: FormData) {
  const { supabase } = await requireTeacher();
  const competencyId = String(formData.get("competency_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const content = String(formData.get("content_md") ?? "").trim();
  const estimatedMinutes = Number(formData.get("estimated_minutes") ?? 45);
  const published = formData.get("published") === "on";

  const { error } = await supabase.from("lessons").insert({
    competency_id: competencyId || null,
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    summary,
    content_md: content,
    estimated_minutes: estimatedMinutes,
    published
  });

  if (error) redirect(`/teacher/lessons?message=${encodeURIComponent(error.message)}`);
  redirect("/teacher/lessons?message=Lesson saved.");
}
