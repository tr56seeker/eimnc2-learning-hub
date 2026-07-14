import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { FlashMessage } from "@/components/FlashMessage";
import { requireTeacher } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { firstRelation } from "@/lib/relations";
import { returnSubmissionForRevisionAction, scoreSubmissionAction } from "./actions";

type AssignmentInfo = { id: string; title: string; max_score: number | null; due_at: string | null };

type SubmissionRow = {
  id: string;
  content_text: string | null;
  file_url: string | null;
  status: string;
  score: number | null;
  feedback: string | null;
  submitted_at: string | null;
  learner_id: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
  assignments: AssignmentInfo | AssignmentInfo[] | null;
};

export default async function TeacherSubmissionsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, content_text, file_url, status, score, feedback, submitted_at, learner_id, profiles(full_name), assignments(id, title, max_score, due_at)")
    .order("submitted_at", { ascending: false })
    .returns<SubmissionRow[]>();

  // Group repeated submissions for the same assignment+learner into one
  // card with a version history, instead of showing every resubmission as
  // an independent, unlinked entry in the queue.
  const groups = new Map<string, SubmissionRow[]>();
  for (const submission of submissions ?? []) {
    const assignment = firstRelation(submission.assignments);
    const key = `${assignment?.id ?? "unknown"}:${submission.learner_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(submission);
  }

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Check Learner Outputs" description="Review links, encode scores, and provide feedback." />

      <FlashMessage message={params.error} variant="error" className="mb-7" />
      <FlashMessage message={params.message} variant="success" className="mb-7" />

      {!groups.size ? (
        <EmptyState title="No submissions yet" message="Learner outputs will appear here." />
      ) : (
        <div className="grid gap-5">
          {[...groups.values()].map((versions) => {
            const latest = versions[0];
            const olderVersions = versions.slice(1);
            const assignment = firstRelation(latest.assignments);
            const learner = firstRelation(latest.profiles);
            const isLate = Boolean(
              assignment?.due_at && latest.submitted_at && new Date(latest.submitted_at).getTime() > new Date(assignment.due_at).getTime()
            );

            return (
              <div key={latest.id} className="card rounded-[1.75rem] p-6 sm:p-7">
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{latest.status}</p>
                      {isLate ? <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">Late</span> : null}
                      {versions.length > 1 ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Version {versions.length}</span>
                      ) : null}
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">{assignment?.title}</h2>
                    <p className="mt-2 text-sm font-medium text-slate-500">Learner: {learner?.full_name}</p>
                    <p className="mt-1 text-sm text-slate-500">Submitted: {formatDateTime(latest.submitted_at)}</p>
                    {latest.file_url ? <a className="mt-4 inline-block font-semibold text-teal-700 hover:underline" href={latest.file_url} target="_blank" rel="noreferrer">Open submitted link</a> : null}
                    {latest.content_text ? <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{latest.content_text}</p> : null}

                    {olderVersions.length ? (
                      <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60">
                        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-600">
                          {olderVersions.length} earlier submission{olderVersions.length === 1 ? "" : "s"}
                        </summary>
                        <div className="grid gap-3 border-t border-slate-200 p-4">
                          {olderVersions.map((version, index) => (
                            <div key={version.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                              <p className="font-semibold text-slate-700">
                                Version {olderVersions.length - index} &middot; {formatDateTime(version.submitted_at)}
                              </p>
                              {version.file_url ? (
                                <a href={version.file_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-teal-700 hover:underline">
                                  Open submitted link
                                </a>
                              ) : null}
                              {version.content_text ? <p className="mt-1 text-slate-600">{version.content_text}</p> : null}
                              {version.score !== null ? (
                                <p className="mt-1 text-slate-500">Previous score: {version.score}/{assignment?.max_score}</p>
                              ) : null}
                              {version.feedback ? <p className="mt-1 text-slate-500">Feedback given: {version.feedback}</p> : null}
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>

                  <form action={scoreSubmissionAction} className="rounded-2xl border border-slate-200/70 bg-white/75 p-5 shadow-sm shadow-slate-200/40">
                    <input type="hidden" name="submission_id" value={latest.id} />
                    <input type="hidden" name="assignment_title" value={assignment?.title ?? "Output"} />
                    <input type="hidden" name="max_score" value={assignment?.max_score ?? 100} />
                    <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
                      Score / {assignment?.max_score ?? 100}
                      <input name="score" type="number" min={0} max={assignment?.max_score ?? 100} defaultValue={latest.score ?? 0} className="focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 font-normal shadow-sm" />
                    </label>
                    <label className="mt-4 grid gap-2.5 text-sm font-semibold text-slate-700">
                      Feedback
                      <textarea name="feedback" rows={4} defaultValue={latest.feedback ?? ""} className="focus-ring rounded-2xl border border-slate-200/80 bg-white/80 p-4 font-normal shadow-sm" placeholder="Required if returning for revision." />
                    </label>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button type="submit" className="rounded-2xl bg-slate-950 px-5 py-3.5 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">
                        Save Score
                      </button>
                      <button
                        type="submit"
                        formAction={returnSubmissionForRevisionAction}
                        className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3.5 font-semibold text-amber-800 hover:bg-amber-100"
                      >
                        Return for Revision
                      </button>
                    </div>
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
