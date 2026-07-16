import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditAction =
  | "learner.created"
  | "learner.updated"
  | "learner.status_changed"
  | "learner.archived"
  | "learner.password_reset"
  | "teacher.created"
  | "teacher.status_changed"
  | "section.created"
  | "section.updated"
  | "section.archived"
  | "section.removed"
  | "gradebook.score_changed"
  | "incident.reviewed"
  | "academic_year.created"
  | "academic_year.updated"
  | "academic_year.set_current"
  | "term.created"
  | "term.updated"
  | "term.set_current"
  | "report.exported"
  | "competency.created"
  | "competency.updated"
  | "competency.archived"
  | "competency.restored";

/**
 * Writes to the `activity_logs` table (the audit trail wired up in Phase 9).
 * Failures are swallowed on purpose: logging must never block the mutation
 * it's describing, since the RLS-scoped `supabase` client here always
 * inserts with actor_id = auth.uid(), which the "logs_insert_authenticated"
 * policy already permits for any authenticated user.
 */
export async function logActivity(
  supabase: SupabaseClient,
  actorId: string,
  action: AuditAction,
  metadata?: Record<string, unknown>
) {
  await supabase.from("activity_logs").insert({ actor_id: actorId, action, metadata: metadata ?? null });
}
