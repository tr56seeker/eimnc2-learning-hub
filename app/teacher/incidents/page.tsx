import { EmptyState } from "@/components/EmptyState";
import { FlashMessage } from "@/components/FlashMessage";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { firstRelation } from "@/lib/relations";
import { setIncidentReviewAction } from "./actions";

type AttemptRow = {
  id: string;
  violation_count: number | null;
  termination_reason: string | null;
  submitted_at: string | null;
  started_at: string | null;
  status: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
  exams: { title: string; max_violations: number | null } | { title: string; max_violations: number | null }[] | null;
};

type ReviewRow = {
  attempt_id: string;
  status: string;
  notes: string | null;
  reviewed_at: string | null;
};

type EventRow = {
  attempt_id: string;
  event_type: string;
  created_at: string;
};

const eventLabels: Record<string, string> = {
  tab_switch: "Switched tabs or apps",
  copy_attempt: "Attempted to copy",
  paste_attempt: "Attempted to paste",
  right_click: "Used right-click / context menu",
  fullscreen_exit: "Exited fullscreen",
  devtools_attempt: "Attempted to open developer tools",
  print_attempt: "Attempted to print the exam",
  idle_timeout: "Long period of no activity"
};

const reviewStatusLabels: Record<string, string> = {
  needs_review: "Needs Review",
  no_concern: "Reviewed — No Concern",
  technical_issue: "Reviewed — Technical Issue",
  clarification_required: "Reviewed — Clarification Required",
  possible_violation: "Reviewed — Possible Violation",
  resolved: "Resolved",
  escalated: "Escalated"
};

function riskLabel(terminated: boolean) {
  if (terminated) return { label: "High Attention", className: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300" };
  return { label: "Needs Review", className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300" };
}

export default async function TeacherIncidentsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("id, violation_count, termination_reason, submitted_at, started_at, status, profiles(full_name), exams(title, max_violations)")
    .gt("violation_count", 0)
    .order("started_at", { ascending: false })
    .returns<AttemptRow[]>();

  const attemptIds = (attempts ?? []).map((attempt) => attempt.id);

  const [{ data: reviews }, { data: events }] = await Promise.all([
    attemptIds.length
      ? supabase.from("exam_incident_reviews").select("attempt_id, status, notes, reviewed_at").in("attempt_id", attemptIds).returns<ReviewRow[]>()
      : Promise.resolve({ data: [] as ReviewRow[] }),
    attemptIds.length
      ? supabase.from("exam_integrity_events").select("attempt_id, event_type, created_at").in("attempt_id", attemptIds).order("created_at").returns<EventRow[]>()
      : Promise.resolve({ data: [] as EventRow[] })
  ]);

  const reviewByAttempt = new Map((reviews ?? []).map((review) => [review.attempt_id, review]));
  const eventsByAttempt = new Map<string, EventRow[]>();
  for (const event of events ?? []) {
    if (!eventsByAttempt.has(event.attempt_id)) eventsByAttempt.set(event.attempt_id, []);
    eventsByAttempt.get(event.attempt_id)!.push(event);
  }

  return (
    <PortalShell profile={profile}>
      <SectionHeader
        eyebrow="Assessment Integrity"
        title="Incident Review"
        description="Monitoring signals are indicators for your review, not automatic proof of cheating."
      />

      <FlashMessage message={params.error} variant="error" className="mb-7" />
      <FlashMessage message={params.message} variant="success" className="mb-7" />

      {!attempts?.length ? (
        <EmptyState title="No integrity signals recorded" message="Flagged exam attempts will appear here." />
      ) : (
        <div className="grid gap-5">
          {attempts.map((attempt) => {
            const learner = firstRelation(attempt.profiles);
            const exam = firstRelation(attempt.exams);
            const terminated = Boolean(attempt.termination_reason);
            const risk = riskLabel(terminated);
            const review = reviewByAttempt.get(attempt.id);
            const timeline = eventsByAttempt.get(attempt.id) ?? [];

            return (
              <div key={attempt.id} className="card rounded-[1.75rem] p-6 sm:p-7">
                <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${risk.className}`}>{risk.label}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {reviewStatusLabels[review?.status ?? "needs_review"]}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-950 dark:text-slate-100">{learner?.full_name ?? "Learner"} &middot; {exam?.title ?? "Exam"}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {attempt.violation_count ?? 0} violation{(attempt.violation_count ?? 0) === 1 ? "" : "s"} &middot; Started {formatDateTime(attempt.started_at)}
                      {attempt.submitted_at ? ` · Submitted ${formatDateTime(attempt.submitted_at)}` : ""}
                    </p>
                    {attempt.termination_reason ? (
                      <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{attempt.termination_reason}</p>
                    ) : null}

                    {timeline.length ? (
                      <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/60">
                        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                          Incident timeline ({timeline.length} event{timeline.length === 1 ? "" : "s"})
                        </summary>
                        <ol className="grid gap-2 border-t border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
                          {timeline.map((event, index) => (
                            <li key={index} className="flex justify-between gap-3">
                              <span>{eventLabels[event.event_type] ?? event.event_type}</span>
                              <span className="tabular-nums text-slate-400 dark:text-slate-500">{formatDateTime(event.created_at)}</span>
                            </li>
                          ))}
                        </ol>
                      </details>
                    ) : null}

                    {review?.notes ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Reviewer notes: {review.notes}</p> : null}
                  </div>

                  <form action={setIncidentReviewAction.bind(null, attempt.id)} className="rounded-2xl border border-slate-200/70 bg-white/75 p-5 shadow-sm shadow-slate-200/40 dark:border-slate-700/70 dark:bg-slate-900/75 dark:shadow-black/20">
                    <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Classify Incident
                      <select name="status" defaultValue={review?.status ?? "needs_review"} className="focus-ring min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 font-normal dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                        {Object.entries(reviewStatusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Reviewer Notes
                      <textarea name="notes" rows={4} defaultValue={review?.notes ?? ""} className="focus-ring rounded-xl border border-slate-200 bg-white p-3 font-normal dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                    </label>
                    <button className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 active:scale-[0.97]">Save Review</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PortalShell>
  );
}
