import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Flips any lesson whose scheduled publish time has passed to published.
 * Called opportunistically from the pages learners/teachers actually load
 * (rather than a cron job or always-on process), so a scheduled lesson goes
 * live the next time anyone requests a lesson list or a lesson detail page.
 * Uses the service-role client because this is a system-level check, not a
 * user-permissioned write — a learner's RLS-scoped client has no write
 * access to `lessons` at all, so this would silently no-op for learner page
 * loads if it ran through the caller's own client.
 */
export async function publishDueLessons() {
  const admin = createAdminClient();

  await admin
    .from("lessons")
    .update({ published: true, scheduled_publish_at: null })
    .eq("published", false)
    .not("scheduled_publish_at", "is", null)
    .lte("scheduled_publish_at", new Date().toISOString());
}
