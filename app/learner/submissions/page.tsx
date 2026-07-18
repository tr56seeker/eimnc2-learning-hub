import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { FlashMessage } from "@/components/FlashMessage";
import { requireLearner } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { resolveFilenamePattern } from "@/lib/filename-pattern";
import { firstRelation } from "@/lib/relations";
import { submitOutputAction } from "./actions";

type AssignmentRow = {
  id: string;
  title: string;
  instructions: string | null;
  due_at: string | null;
  max_score: number | null;
  expected_filename_pattern: string | null;
  lessons: { title: string } | { title: string }[] | null;
};

type SubmissionRow = {
  id: string;
  assignment_id: string;
  status: string;
  score: number | null;
  feedback: string | null;
  submitted_at: string | null;
  submitted_filename: string | null;
  assignments: { title: string; max_score: number | null } | { title: string; max_score: number | null }[] | null;
};

function statusLabel(status: string, isLate: boolean) {
  if (status === "returned") return "Returned for revision";
  if (status === "checked") return "Checked";
  return isLate ? "Submitted late" : "Submitted";
}

function statusClass(status: string) {
  if (status === "returned") return "rounded-full bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300";
  if (status === "checked") return "rounded-full bg-teal-50 dark:bg-amber-950/40 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-amber-400";
  return "rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400";
}

export default async function LearnerSubmissionsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireLearner();

  const [assignmentsResult, submissionsResult, sectionResult] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, title, instructions, due_at, max_score, expected_filename_pattern, lessons(title)")
      .eq("is_active", true)
      .order("due_at", { ascending: true })
      .returns<AssignmentRow[]>(),
    supabase
      .from("submissions")
      .select("id, assignment_id, status, score, feedback, submitted_at, submitted_filename, assignments(title, max_score)")
      .eq("learner_id", profile.id)
      .order("submitted_at", { ascending: false })
      .returns<SubmissionRow[]>(),
    profile.section_id
      ? supabase.from("sections").select("name").eq("id", profile.section_id).maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  const assignments = assignmentsResult.data ?? [];
  const submissions = submissionsResult.data ?? [];
  const sectionName = sectionResult.data?.name ?? null;
  // eslint-disable-next-line react-hooks/purity -- server-rendered per request; needs the actual current time to flag overdue assignments
  const now = Date.now();

  const submissionsByAssignment = new Map<string, SubmissionRow[]>();
  for (const submission of submissions) {
    if (!submissionsByAssignment.has(submission.assignment_id)) submissionsByAssignment.set(submission.assignment_id, []);
    submissionsByAssignment.get(submission.assignment_id)!.push(submission);
  }

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Submissions" title="Submit EIM Outputs" description="Submit practical outputs through text, Google Drive link, PDF link, image link, or unlisted video link." />

      <FlashMessage message={params.error} variant="error" className="mb-7" />
      <FlashMessage message={params.message} variant="success" className="mb-7" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="card rounded-[1.75rem] p-7 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">My Activities</h2>
          {!assignments.length ? (
            <div className="mt-4"><EmptyState title="No assignments" message="Your teacher has not posted an output task yet." /></div>
          ) : (
            <div className="mt-6 grid gap-3">
              {assignments.map((assignment) => {
                const latest = submissionsByAssignment.get(assignment.id)?.[0];
                const isLate = Boolean(latest?.submitted_at && assignment.due_at && new Date(latest.submitted_at).getTime() > new Date(assignment.due_at).getTime());
                const isMissing = !latest && Boolean(assignment.due_at && new Date(assignment.due_at).getTime() < now);
                const nextVersion = (submissionsByAssignment.get(assignment.id)?.length ?? 0) + 1;
                const expectedFilename = assignment.expected_filename_pattern
                  ? resolveFilenamePattern(assignment.expected_filename_pattern, {
                      lrn: profile.lrn,
                      firstName: profile.first_name,
                      lastName: profile.last_name,
                      fullName: profile.full_name,
                      section: sectionName,
                      activityTitle: assignment.title,
                      version: nextVersion
                    })
                  : null;

                return (
                  <div key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/75 dark:bg-slate-900/75 p-4">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-slate-100">{assignment.title}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{assignment.due_at ? `Due ${formatDateTime(assignment.due_at)}` : "No due date"}</p>
                      {expectedFilename ? (
                        <p className="mt-1 text-xs font-semibold text-teal-700 dark:text-amber-400">Name your file: {expectedFilename}</p>
                      ) : null}
                    </div>
                    <span className={isMissing ? "rounded-full bg-red-50 dark:bg-red-950/30 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-400" : latest ? statusClass(latest.status) : "rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400"}>
                      {isMissing ? "Missing" : latest ? statusLabel(latest.status, isLate) : "Not yet submitted"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <h2 className="mt-9 text-xl font-semibold text-slate-950 dark:text-slate-100">New Submission</h2>
          {!assignments.length ? null : (
            <form action={submitOutputAction} className="mt-5 grid gap-5">
              <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Assignment
                <select name="assignment_id" required className="focus-ring w-full min-h-12 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 px-4 py-3 font-normal shadow-sm">
                  <option value="">Select task</option>
                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>{assignment.title}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Output link
                <input name="file_url" type="url" className="focus-ring w-full min-h-12 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 px-4 py-3 font-normal shadow-sm" placeholder="Google Drive / YouTube unlisted / image link" />
              </label>
              <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Notes / explanation
                <textarea name="content_text" rows={6} className="focus-ring w-full max-w-full resize-y rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 p-4 font-normal shadow-sm" placeholder="Briefly explain your submitted work." />
              </label>
              <button className="rounded-2xl bg-slate-950 px-5 py-3.5 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:bg-teal-700">Submit Output</button>
            </form>
          )}
        </section>

        <section className="card rounded-[1.75rem] p-7 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">My Submitted Outputs</h2>
          <div className="mt-7 grid gap-4">
            {!submissions.length ? (
              <EmptyState title="No submissions yet" message="Your submitted outputs will appear here." />
            ) : submissions.map((submission) => {
              const assignment = firstRelation(submission.assignments);

              return (
                <div key={submission.id} className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/75 dark:bg-slate-900/75 p-5 shadow-sm shadow-slate-200/40 dark:shadow-black/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-950 dark:text-slate-100">{assignment?.title}</h3>
                    <span className={statusClass(submission.status)}>{statusLabel(submission.status, false)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Submitted: {formatDateTime(submission.submitted_at)}</p>
                  {submission.submitted_filename ? <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">File name used: {submission.submitted_filename}</p> : null}
                  {submission.score !== null ? <p className="text-sm font-semibold text-teal-700 dark:text-amber-400">Score: {submission.score}/{assignment?.max_score}</p> : null}
                  {submission.feedback ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Feedback: {submission.feedback}</p> : null}
                  {submission.status === "returned" ? (
                    <p className="mt-2 text-sm font-semibold text-amber-800 dark:text-amber-300">Your teacher asked for a revision — submit an updated version above.</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
