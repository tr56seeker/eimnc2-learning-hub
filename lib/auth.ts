import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getCurrentUserAndProfile() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, lrn, section_id")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    redirect("/signup/profile");
  }

  const profile = data as Profile;
  return { user, profile, supabase };
}

export async function requireTeacher() {
  const result = await getCurrentUserAndProfile();
  if (result.profile.role !== "teacher" && result.profile.role !== "admin") {
    redirect("/learner/dashboard");
  }
  return result;
}

export async function requireLearner() {
  const result = await getCurrentUserAndProfile();
  if (result.profile.role !== "learner") {
    redirect("/teacher/dashboard");
  }
  return result;
}
