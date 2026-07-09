"use server";

import { redirect } from "next/navigation";
import { loginEmailFromIdentifier } from "@/lib/learner-accounts";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const loginId = String(formData.get("email") ?? "").trim();
  const email = loginEmailFromIdentifier(loginId);
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/portal");
}
