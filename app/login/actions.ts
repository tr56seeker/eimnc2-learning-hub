"use server";

import { redirect } from "next/navigation";
import { loginEmailFromIdentifier } from "@/lib/learner-accounts";
import { createClient } from "@/lib/supabase/server";

const LOCKOUT_MESSAGE = "Too many failed attempts. Please wait 15 minutes and try again.";
const SUSPENDED_MESSAGE = "This account has been suspended. Contact your school administrator.";

export async function loginAction(formData: FormData) {
  const loginId = String(formData.get("email") ?? "").trim();
  const email = loginEmailFromIdentifier(loginId);
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();

  const { data: locked } = await supabase.rpc("is_login_locked", { p_identifier: loginId });
  if (locked) {
    redirect(`/login?message=${encodeURIComponent(LOCKOUT_MESSAGE)}`);
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    await supabase.rpc("record_failed_login", { p_identifier: loginId });
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  await supabase.rpc("clear_login_attempts", { p_identifier: loginId });

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", signInData.user.id)
    .maybeSingle();

  if (profile?.status === "inactive" || profile?.status === "deleted") {
    await supabase.auth.signOut();
    redirect(`/login?message=${encodeURIComponent(SUSPENDED_MESSAGE)}`);
  }

  redirect("/portal");
}
