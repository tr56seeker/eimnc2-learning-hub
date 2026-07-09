import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

const PROFILE_SELECT = "id, full_name, first_name, last_name, middle_initial, role, email, lrn, section_id, grade_level, status, must_change_password";
const LEGACY_PROFILE_SELECT = "id, full_name, role, lrn, section_id";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type AuthUser = Awaited<ReturnType<SupabaseServerClient["auth"]["getUser"]>>["data"]["user"];

function normalizeProfile(data: Partial<Profile>, fallbackEmail?: string | null): Profile {
  return {
    id: String(data.id),
    full_name: String(data.full_name ?? fallbackEmail ?? "Learner"),
    first_name: data.first_name ?? null,
    last_name: data.last_name ?? null,
    middle_initial: data.middle_initial ?? null,
    role: data.role ?? "learner",
    email: data.email ?? fallbackEmail ?? null,
    lrn: data.lrn ?? null,
    section_id: data.section_id ?? null,
    grade_level: data.grade_level ?? null,
    status: data.status ?? "active",
    must_change_password: Boolean(data.must_change_password ?? false)
  };
}

async function fetchProfile(supabase: SupabaseServerClient, user: NonNullable<AuthUser>) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  if (!error) {
    return data ? normalizeProfile(data as Partial<Profile>, user.email) : null;
  }

  const { data: legacyData, error: legacyError } = await supabase
    .from("profiles")
    .select(LEGACY_PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  if (legacyError) {
    redirect(`/signup/profile?message=${encodeURIComponent(legacyError.message)}`);
  }

  return legacyData ? normalizeProfile(legacyData as Partial<Profile>, user.email) : null;
}

async function createDefaultLearnerProfile(supabase: SupabaseServerClient, user: NonNullable<AuthUser>) {
  const defaultName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email ?? "Learner";

  const baseProfile = {
    id: user.id,
    full_name: defaultName,
    role: "learner",
    lrn: null,
    section_id: null
  };

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      ...baseProfile,
      email: user.email ?? null,
      grade_level: null,
      status: "active",
      must_change_password: false
    })
    .select(PROFILE_SELECT)
    .single();

  if (!error && data) {
    return normalizeProfile(data as Partial<Profile>, user.email);
  }

  const existingProfile = await fetchProfile(supabase, user);
  if (existingProfile) {
    return existingProfile;
  }

  const { data: legacyData, error: legacyError } = await supabase
    .from("profiles")
    .insert(baseProfile)
    .select(LEGACY_PROFILE_SELECT)
    .single();

  if (legacyError || !legacyData) {
    redirect(
      `/signup/profile?message=${encodeURIComponent(
        legacyError?.message ?? error?.message ?? "Unable to create profile."
      )}`
    );
  }

  return normalizeProfile(legacyData as Partial<Profile>, user.email);
}

export async function getCurrentUserAndProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const profile = (await fetchProfile(supabase, user)) ?? (await createDefaultLearnerProfile(supabase, user));

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

  if (result.profile.must_change_password) {
    redirect("/account/change-password");
  }

  return result;
}
