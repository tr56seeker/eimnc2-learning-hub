import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { requireLearner } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { firstRelation } from "@/lib/relations";
import { submitOutputAction } from "./actions";

export default async function LearnerSubmissionsPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireLearner();

  const [assignmentsResult, submissionsResult] = await Promise.all([
    supabase.from("assignments").select("id, title, instructions, due_at, max_score, lessons(title)").order("due_at", { ascending: true }),
    supabase.from("submissions").select("id, status, score, feedback, submitted_at, assignments(title, max_score)").eq("learner_id", profile.id).order("submitted_at", { ascending: false })
  ]);

  const assignments = assignmentsResult.data ?? [];
  const submissions = submissionsResult.data ?? [];

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Submissions" title="Submit EIM Outputs" description="Submit practical outputs through text, Google Drive link, PDF link, image link, or unlisted video link." />

      {params.message ? <div className="mb-5 rounded-2xl border border-teal-200 bg-teal-50 p-4 font-bold text-teal-800">{params.message}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="card rounded-[2rem] p-6">
          <h2 className="text-xl font-black text-slate-950">New Submission</h2>
          {!assignments.length ? (
            <div className="mt-4"><EmptyState title="No assignments" message="Your teacher has not posted an output task yet." /></div>
          ) : (
            <form action={submitOutputAction} className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Assignment
                <select name="assignment_id" required className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-normal">
                  <option value="">Select task</option>
                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>{assignment.title}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Output link
                <input name="file_url" type="url" className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-normal" placeholder="Google Drive / YouTube unlisted / image link" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Notes / explanation
                <textarea name="content_text" rows={6} className="focus-ring rounded-2xl border border-slate-200 p-4 font-normal" placeholder="Briefly explain your submitted work." />
              </label>
              <button className="rounded-2xl bg-teal-700 px-5 py-3 font-black text-white hover:bg-teal-800">Submit Output</button>
            </form>
          )}
        </section>

        <section className="card rounded-[2rem] p-6">
          <h2 className="text-xl font-black text-slate-950">My Submitted Outputs</h2>
          <div className="mt-5 grid gap-3">
            {!submissions.length ? (
              <EmptyState title="No submissions yet" message="Your submitted outputs will appear here." />
            ) : submissions.map((submission) => {
              const assignment = firstRelation(submission.assignments);

              return (
                <div key={submission.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="font-black text-slate-950">{assignment?.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">Submitted: {formatDateTime(submission.submitted_at)}</p>
                  <p className="mt-2 text-sm font-bold text-slate-700">Status: {submission.status}</p>
                  {submission.score !== null ? <p className="text-sm font-bold text-teal-700">Score: {submission.score}/{assignment?.max_score}</p> : null}
                  {submission.feedback ? <p className="mt-2 text-sm text-slate-600">Feedback: {submission.feedback}</p> : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
