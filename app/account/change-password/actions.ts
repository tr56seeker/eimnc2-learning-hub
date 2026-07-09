"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function changePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    redirect("/account/change-password?message=Password%20must%20be%20at%20least%208%20characters");
  }

  if (password !== confirmPassword) {
    redirect("/account/change-password?message=Passwords%20do%20not%20match");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) {
    redirect(`/account/change-password?message=${encodeURIComponent(passwordError.message)}`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id);

  if (profileError) {
    redirect(`/account/change-password?message=${encodeURIComponent(profileError.message)}`);
  }

  redirect("/learner/dashboard");
}
