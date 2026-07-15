"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export type TeacherAccountState = {
  ok: boolean;
  message: string;
  credentials?: {
    fullName: string;
    email: string;
    temporaryPassword: string;
  };
};

const DEFAULT_TEACHER_PASSWORD = "eimnc2teacher";

function accountMessage(message: string): TeacherAccountState {
  return { ok: false, message };
}

export async function createTeacherAction(
  _previousState: TeacherAccountState,
  formData: FormData
): Promise<TeacherAccountState> {
  const { profile } = await requireAdmin();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "teacher") === "admin" ? "admin" : "teacher";

  if (!fullName || !email) {
    return accountMessage("Full name and email are required.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEFAULT_TEACHER_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, role }
  });

  if (error || !data.user) {
    return accountMessage(error?.message ?? "Unable to create account.");
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      full_name: fullName,
      role,
      email,
      status: "active",
      must_change_password: true
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return accountMessage(profileError.message);
  }

  revalidatePath("/teacher/admin/teachers");
  await logActivity(admin, profile.id, "teacher.created", { account_id: data.user.id, role });

  return {
    ok: true,
    message: "Account created.",
    credentials: { fullName, email, temporaryPassword: DEFAULT_TEACHER_PASSWORD }
  };
}

export async function toggleTeacherStatusAction(teacherId: string, nextStatus: "active" | "inactive") {
  const { profile } = await requireAdmin();

  if (teacherId === profile.id) {
    redirect("/teacher/admin/teachers?error=You%20cannot%20deactivate%20your%20own%20account.");
  }

  const admin = createAdminClient();

  const { error } = await admin.from("profiles").update({ status: nextStatus }).eq("id", teacherId).in("role", ["teacher", "admin"]);

  if (error) {
    redirect(`/teacher/admin/teachers?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/teacher/admin/teachers");
  await logActivity(admin, profile.id, "teacher.status_changed", { account_id: teacherId, status: nextStatus });

  redirect(`/teacher/admin/teachers?message=${encodeURIComponent(`Account ${nextStatus === "active" ? "activated" : "deactivated"}`)}`);
}
