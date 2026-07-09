"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signupAction(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const lrn = String(formData.get("lrn") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const sectionId = String(formData.get("section_id") ?? "").trim() || null;
  const gradeLevelValue = String(formData.get("grade_level") ?? "").trim();
  const gradeLevel = gradeLevelValue ? Number(gradeLevelValue) : null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    redirect(`/signup?message=${encodeURIComponent(error?.message ?? "Unable to create account")}`);
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    full_name: fullName,
    role: "learner",
    email,
    lrn,
    section_id: sectionId,
    grade_level: gradeLevel,
    status: "active"
  });

  if (profileError) {
    redirect(`/signup?message=${encodeURIComponent(profileError.message)}`);
  }

  redirect("/portal");
}
