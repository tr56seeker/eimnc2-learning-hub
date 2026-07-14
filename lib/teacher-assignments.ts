import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Whether the current teacher (per the RLS-scoped `supabase` client bound to
 * their session) is authorized to manage the given learner. Reuses the
 * `profiles_select_own_or_teacher` RLS policy as the single source of truth
 * for section-assignment scoping instead of duplicating that logic here —
 * if the teacher isn't assigned to the learner's section, RLS returns no
 * row and this resolves to false.
 */
export async function canManageLearner(supabase: SupabaseClient, learnerId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", learnerId)
    .eq("role", "learner")
    .maybeSingle();

  return Boolean(data);
}
