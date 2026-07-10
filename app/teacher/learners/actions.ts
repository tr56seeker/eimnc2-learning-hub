"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import {
  buildLearnerFullName,
  formatLearnerName,
  normalizeLearnerId,
  normalizeMiddleInitial,
  resolveLearnerLoginEmail
} from "@/lib/learner-accounts";
import { createAdminClient } from "@/lib/supabase/admin";

export type LearnerEnrollmentState = {
  ok: boolean;
  message: string;
  credentials?: {
    learnerName: string;
    loginId: string;
    temporaryPassword: string;
    sectionName: string;
  };
};

export type LearnerPasswordResetState = {
  ok: boolean;
  message: string;
  credentials?: {
    learnerName: string;
    loginId: string;
    temporaryPassword: string;
  };
};

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function enrollmentMessage(message: string): LearnerEnrollmentState {
  return { ok: false, message };
}

function passwordResetMessage(message: string): LearnerPasswordResetState {
  return { ok: false, message };
}

function learnerPayloadFromForm(formData: FormData) {
  const lastName = String(formData.get("last_name") ?? "").trim();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const middleInitial = normalizeMiddleInitial(String(formData.get("middle_initial") ?? ""));
  const lrn = normalizeLearnerId(String(formData.get("lrn") ?? "")) || null;
  const loginId = String(formData.get("login_id") ?? "").trim();
  const sectionId = nullableText(formData.get("section_id"));
  const gradeLevel = nullableText(formData.get("grade_level"));
  const status = String(formData.get("status") ?? "active") === "inactive" ? "inactive" : "active";
  const fullName = buildLearnerFullName(firstName, middleInitial, lastName);

  return { lastName, firstName, middleInitial, lrn, loginId, sectionId, gradeLevel, status, fullName };
}

export async function createLearnerAction(
  _previousState: LearnerEnrollmentState,
  formData: FormData
): Promise<LearnerEnrollmentState> {
  const { supabase } = await requireTeacher();

  const payload = learnerPayloadFromForm(formData);
  const password = String(formData.get("password") ?? "");

  if (!payload.lastName || !payload.firstName || !password) {
    return enrollmentMessage("Last name, first name, and temporary password are required.");
  }

  if (password.length < 8) {
    return enrollmentMessage("Temporary password must be at least 8 characters.");
  }

  let email: string;
  try {
    email = resolveLearnerLoginEmail(payload.loginId, payload.lrn);
  } catch (error) {
    return enrollmentMessage(error instanceof Error ? error.message : "Enter a valid login ID.");
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.fullName,
        first_name: payload.firstName,
        last_name: payload.lastName,
        middle_initial: payload.middleInitial,
        lrn: payload.lrn,
        role: "learner"
      }
    });

    if (error || !data.user) {
      return enrollmentMessage(error?.message ?? "Unable to create learner account.");
    }

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: payload.fullName,
        first_name: payload.firstName,
        last_name: payload.lastName,
        middle_initial: payload.middleInitial,
        role: "learner",
        email,
        lrn: payload.lrn,
        section_id: payload.sectionId,
        grade_level: payload.gradeLevel,
        status: payload.status,
        must_change_password: true
      },
      { onConflict: "id" }
    );

    if (profileError) {
      return enrollmentMessage(profileError.message);
    }

    const { data: section } = payload.sectionId
      ? await supabase
          .from("sections")
          .select("name, grade_level")
          .eq("id", payload.sectionId)
          .maybeSingle<{ name: string; grade_level: string | number }>()
      : { data: null };

    revalidatePath("/teacher/learners");
    revalidatePath("/teacher/dashboard");

    return {
      ok: true,
      message: "Learner enrolled.",
      credentials: {
        learnerName: payload.fullName,
        loginId: email,
        temporaryPassword: password,
        sectionName: section ? `Grade ${section.grade_level} - ${section.name}` : "No section assigned"
      }
    };
  } catch (error) {
    return enrollmentMessage(error instanceof Error ? error.message : "Unable to create learner account.");
  }
}

export async function updateLearnerAction(learnerId: string, formData: FormData) {
  await requireTeacher();

  const payload = learnerPayloadFromForm(formData);

  if (!payload.lastName || !payload.firstName) {
    redirect("/teacher/learners?message=Last%20name%20and%20first%20name%20are%20required");
  }

  let email: string;
  try {
    email = resolveLearnerLoginEmail(payload.loginId, payload.lrn);
  } catch (error) {
    redirect(`/teacher/learners?message=${encodeURIComponent(error instanceof Error ? error.message : "Enter a valid login ID.")}`);
  }

  const admin = createAdminClient();
  const { error: authError } = await admin.auth.admin.updateUserById(learnerId, {
    email,
    user_metadata: {
      full_name: payload.fullName,
      first_name: payload.firstName,
      last_name: payload.lastName,
      middle_initial: payload.middleInitial,
      lrn: payload.lrn,
      role: "learner"
    }
  });

  if (authError) {
    redirect(`/teacher/learners?message=${encodeURIComponent(authError.message)}`);
  }

  const { error } = await admin
    .from("profiles")
    .update({
      full_name: payload.fullName,
      first_name: payload.firstName,
      last_name: payload.lastName,
      middle_initial: payload.middleInitial,
      email,
      lrn: payload.lrn,
      section_id: payload.sectionId,
      grade_level: payload.gradeLevel,
      status: payload.status
    })
    .eq("id", learnerId)
    .eq("role", "learner");

  if (error) {
    redirect(`/teacher/learners?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/learners");
  revalidatePath(`/teacher/learners/${learnerId}`);
  revalidatePath("/teacher/dashboard");
  redirect("/teacher/learners?message=Learner%20updated");
}

export async function toggleLearnerStatusAction(learnerId: string, nextStatus: "active" | "inactive") {
  await requireTeacher();

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status: nextStatus })
    .eq("id", learnerId)
    .eq("role", "learner");

  if (error) {
    redirect(`/teacher/learners?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/learners");
  revalidatePath(`/teacher/learners/${learnerId}`);
  revalidatePath("/teacher/dashboard");
  redirect(`/teacher/learners?message=${encodeURIComponent(`Learner ${nextStatus === "active" ? "activated" : "deactivated"}`)}`);
}

export async function softDeleteLearnerAction(learnerId: string) {
  await requireTeacher();

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status: "deleted" })
    .eq("id", learnerId)
    .eq("role", "learner");

  if (error) {
    redirect(`/teacher/learners?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/learners");
  revalidatePath(`/teacher/learners/${learnerId}`);
  revalidatePath("/teacher/dashboard");
  redirect("/teacher/learners?message=Learner%20soft%20deleted");
}

export async function resetLearnerPasswordAction(
  learnerId: string,
  _previousState: LearnerPasswordResetState,
  formData: FormData
): Promise<LearnerPasswordResetState> {
  await requireTeacher();

  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return passwordResetMessage("Temporary password must be at least 8 characters.");
  }

  const admin = createAdminClient();
  const { data: learner, error: learnerError } = await admin
    .from("profiles")
    .select("id, full_name, first_name, last_name, middle_initial, email, role")
    .eq("id", learnerId)
    .eq("role", "learner")
    .maybeSingle<{
      id: string;
      full_name: string;
      first_name: string | null;
      last_name: string | null;
      middle_initial: string | null;
      email: string | null;
      role: string;
    }>();

  if (learnerError || !learner) {
    return passwordResetMessage(learnerError?.message ?? "Learner profile was not found.");
  }

  const { error: authError } = await admin.auth.admin.updateUserById(learnerId, { password });
  if (authError) {
    return passwordResetMessage(authError.message);
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ must_change_password: true })
    .eq("id", learnerId)
    .eq("role", "learner");

  if (profileError) {
    return passwordResetMessage(profileError.message);
  }

  revalidatePath("/teacher/learners");
  revalidatePath(`/teacher/learners/${learnerId}`);

  return {
    ok: true,
    message: "Password reset.",
    credentials: {
      learnerName: formatLearnerName({
        full_name: learner.full_name,
        first_name: learner.first_name,
        last_name: learner.last_name,
        middle_initial: learner.middle_initial
      }),
      loginId: learner.email ?? "",
      temporaryPassword: password
    }
  };
}
