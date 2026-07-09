import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { requireTeacher } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { scoreSubmissionAction } from "./actions";

export default async function TeacherSubmissionsPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, content_text, file_url, status, score, feedback, submitted_at, learner_id, profiles(full_name), assignments(title, max_score)")
    .order("submitted_at", { ascending: false });

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Check Learner Outputs" description="Review links, encode scores, and provide feedback." />

      {params.message ? <div className="mb-5 rounded-2xl border border-teal-200 bg-teal-50 p-4 font-bold text-teal-800">{params.message}</div> : null}

      {!submissions?.length ? (
        <EmptyState title="No submissions yet" message="Learner outputs will appear here." />
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="card rounded-3xl p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">{submission.status}</p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">{submission.assignments?.title}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">Learner: {submission.profiles?.full_name}</p>
                  <p className="mt-1 text-sm text-slate-500">Submitted: {formatDateTime(submission.submitted_at)}</p>
                  {submission.file_url ? <a className="mt-4 inline-block font-bold text-teal-700 hover:underline" href={submission.file_url} target="_blank" rel="noreferrer">Open submitted link →</a> : null}
                  {submission.content_text ? <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{submission.content_text}</p> : null}
                </div>

                <form action={scoreSubmissionAction} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <input type="hidden" name="submission_id" value={submission.id} />
                  <input type="hidden" name="learner_id" value={submission.learner_id} />
                  <input type="hidden" name="assignment_title" value={submission.assignments?.title ?? "Output"} />
                  <input type="hidden" name="max_score" value={submission.assignments?.max_score ?? 100} />
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Score / {submission.assignments?.max_score ?? 100}
                    <input name="score" type="number" min={0} max={submission.assignments?.max_score ?? 100} defaultValue={submission.score ?? 0} className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-normal" />
                  </label>
                  <label className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
                    Feedback
                    <textarea name="feedback" rows={4} defaultValue={submission.feedback ?? ""} className="focus-ring rounded-2xl border border-slate-200 p-4 font-normal" />
                  </label>
                  <button className="mt-4 w-full rounded-2xl bg-teal-700 px-5 py-3 font-black text-white hover:bg-teal-800">Save Score</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
