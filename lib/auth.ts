import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

const PROFILE_SELECT = "id, full_name, role, lrn, section_id";

export async function getCurrentUserAndProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: normalProfile } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  let profileData = normalProfile;

  if (!profileData) {
    const admin = createAdminClient();

    const { data: adminProfile } = await admin
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", user.id)
      .maybeSingle();

    profileData = adminProfile;

    if (!profileData) {
      const defaultName =
        typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
          ? user.user_metadata.full_name.trim()
          : user.email ?? "Learner";

      const { data: createdProfile, error: createError } = await admin
        .from("profiles")
        .insert({
          id: user.id,
          full_name: defaultName,
          role: "learner",
          lrn: null,
          section_id: null
        })
        .select(PROFILE_SELECT)
        .single();

      if (createError || !createdProfile) {
        redirect(
          `/signup/profile?message=${encodeURIComponent(
            createError?.message ?? "Unable to create profile."
          )}`
        );
      }

      profileData = createdProfile;
    }
  }

  const profile = profileData as Profile;

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