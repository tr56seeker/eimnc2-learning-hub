"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function nullableNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? Number(text) : null;
}

export async function createLearnerAction(formData: FormData) {
  await requireTeacher();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const lrn = nullableText(formData.get("lrn"));
  const sectionId = nullableText(formData.get("section_id"));
  const gradeLevel = nullableNumber(formData.get("grade_level"));
  const status = String(formData.get("status") ?? "active");

  if (!fullName || !email || !password) {
    redirect("/teacher/learners?message=Full%20name%2C%20email%2C%20and%20temporary%20password%20are%20required");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (error || !data.user) {
    redirect(`/teacher/learners?message=${encodeURIComponent(error?.message ?? "Unable to create learner account")}`);
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    full_name: fullName,
    role: "learner",
    email,
    lrn,
    section_id: sectionId,
    grade_level: gradeLevel,
    status
  });

  if (profileError) {
    redirect(`/teacher/learners?message=${encodeURIComponent(profileError.message)}`);
  }

  revalidatePath("/teacher/learners");
  revalidatePath("/teacher/dashboard");
  redirect("/teacher/learners?message=Learner%20created");
}

export async function updateLearnerAction(learnerId: string, formData: FormData) {
  await requireTeacher();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = nullableText(formData.get("email"));
  const lrn = nullableText(formData.get("lrn"));
  const sectionId = nullableText(formData.get("section_id"));
  const gradeLevel = nullableNumber(formData.get("grade_level"));
  const status = String(formData.get("status") ?? "active");

  const admin = createAdminClient();
  if (email) {
    const { error: authError } = await admin.auth.admin.updateUserById(learnerId, {
      email,
      user_metadata: { full_name: fullName }
    });

    if (authError) {
      redirect(`/teacher/learners?message=${encodeURIComponent(authError.message)}`);
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      email,
      lrn,
      section_id: sectionId,
      grade_level: gradeLevel,
      status
    })
    .eq("id", learnerId)
    .eq("role", "learner");

  if (error) {
    redirect(`/teacher/learners?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/learners");
  revalidatePath("/teacher/dashboard");
  redirect("/teacher/learners?message=Learner%20updated");
}
