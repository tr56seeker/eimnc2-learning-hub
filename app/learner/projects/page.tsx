import { EmptyState } from "@/components/EmptyState";
import { FlashMessage } from "@/components/FlashMessage";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireLearner } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { firstRelation } from "@/lib/relations";
import { submitMilestoneEvidenceAction } from "./actions";

type AssignmentRow = {
  id: string;
  project_id: string;
  status: string;
  progress_percentage: number;
  final_score: number | null;
  teacher_comments: string | null;
  projects: { id: string; title: string; overview: string | null; due_at: string | null } | { id: string; title: string; overview: string | null; due_at: string | null }[] | null;
};

type MilestoneRow = { id: string; project_id: string; title: string; description: string | null; due_at: string | null; display_order: number };

type SubmissionRow = {
  id: string;
  milestone_id: string;
  content_text: string | null;
  file_url: string | null;
  status: string;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
};

const statusLabels: Record<string, string> = {
  on_track: "On Track",
  delayed: "Delayed",
  needs_intervention: "Needs Intervention",
  completed: "Completed"
};

const statusClasses: Record<string, string> = {
  on_track: "bg-teal-50 dark:bg-amber-950/40 text-teal-700 dark:text-amber-400",
  delayed: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300",
  needs_intervention: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400",
  completed: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
};

const submissionStatusLabels: Record<string, string> = {
  submitted: "Submitted, awaiting review",
  checked: "Checked",
  returned: "Returned for revision"
};

export default async function LearnerProjectsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireLearner();

  const { data: assignments } = await supabase
    .from("project_assignments")
    .select("id, project_id, status, progress_percentage, final_score, teacher_comments, projects(id, title, overview, due_at)")
    .eq("learner_id", profile.id)
    .returns<AssignmentRow[]>();

  const projectIds = (assignments ?? []).map((assignment) => assignment.project_id);

  const [{ data: milestones }, { data: submissions }] = await Promise.all([
    projectIds.length
      ? supabase.from("project_milestones").select("id, project_id, title, description, due_at, display_order").in("project_id", projectIds).order("display_order").returns<MilestoneRow[]>()
      : Promise.resolve({ data: [] as MilestoneRow[] }),
    projectIds.length
      ? supabase
          .from("milestone_submissions")
          .select("id, milestone_id, content_text, file_url, status, score, feedback, submitted_at")
          .eq("learner_id", profile.id)
          .order("submitted_at", { ascending: false })
          .returns<SubmissionRow[]>()
      : Promise.resolve({ data: [] as SubmissionRow[] })
  ]);

  const latestSubmissionByMilestone = new Map<string, SubmissionRow>();
  for (const submission of submissions ?? []) {
    if (!latestSubmissionByMilestone.has(submission.milestone_id)) latestSubmissionByMilestone.set(submission.milestone_id, submission);
  }

  const milestonesByProject = new Map<string, MilestoneRow[]>();
  for (const milestone of milestones ?? []) {
    if (!milestonesByProject.has(milestone.project_id)) milestonesByProject.set(milestone.project_id, []);
    milestonesByProject.get(milestone.project_id)!.push(milestone);
  }

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Projects" title="My Projects" description="Track your milestones and submit evidence for each performance-task project." />

      <FlashMessage message={params.error} variant="error" className="mb-7" />
      <FlashMessage message={params.message} variant="success" className="mb-7" />

      {!assignments?.length ? (
        <EmptyState title="No projects assigned" message="Your teacher hasn't assigned you to a project yet." />
      ) : (
        <div className="grid gap-6">
          {assignments.map((assignment) => {
            const project = firstRelation(assignment.projects);
            const projectMilestones = milestonesByProject.get(assignment.project_id) ?? [];

            return (
              <section key={assignment.id} className="card rounded-[1.75rem] p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">{project?.title ?? "Project"}</h2>
                    {project?.overview ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">{project.overview}</p> : null}
                    {project?.due_at ? <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Due {formatDateTime(project.due_at)}</p> : null}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[assignment.status] ?? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
                    {statusLabels[assignment.status] ?? assignment.status}
                  </span>
                </div>

                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-teal-500" style={{ width: `${assignment.progress_percentage}%` }} />
                </div>
                <p className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{assignment.progress_percentage}% complete</p>

                {assignment.final_score !== null ? (
                  <p className="mt-3 text-sm font-semibold text-teal-700 dark:text-amber-400">Final score: {assignment.final_score}</p>
                ) : null}
                {assignment.teacher_comments ? (
                  <p className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-sm leading-6 text-slate-700 dark:text-slate-300">Teacher comments: {assignment.teacher_comments}</p>
                ) : null}

                <div className="mt-6 grid gap-4">
                  {projectMilestones.map((milestone) => {
                    const submission = latestSubmissionByMilestone.get(milestone.id);

                    return (
                      <div key={milestone.id} className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{milestone.title}</p>
                          {milestone.due_at ? <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Due {formatDateTime(milestone.due_at)}</span> : null}
                        </div>
                        {milestone.description ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{milestone.description}</p> : null}

                        {submission ? (
                          <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-sm">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">{submissionStatusLabels[submission.status] ?? submission.status}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Submitted {formatDateTime(submission.submitted_at)}</p>
                            {submission.score !== null ? <p className="mt-1 font-semibold text-teal-700 dark:text-amber-400">Score: {submission.score}</p> : null}
                            {submission.feedback ? <p className="mt-1 text-slate-600 dark:text-slate-400">Feedback: {submission.feedback}</p> : null}
                          </div>
                        ) : null}

                        {!submission || submission.status === "returned" ? (
                          <form action={submitMilestoneEvidenceAction} className="mt-4 grid gap-3">
                            <input type="hidden" name="milestone_id" value={milestone.id} />
                            <input name="file_url" type="url" placeholder="Evidence link (photo, video, document)" className="focus-ring min-h-11 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-normal shadow-sm" />
                            <textarea name="content_text" rows={2} placeholder="Notes about your evidence" className="focus-ring rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-3 text-sm font-normal shadow-sm" />
                            <button className="w-fit rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 active:scale-[0.97]">
                              {submission?.status === "returned" ? "Resubmit Evidence" : "Submit Evidence"}
                            </button>
                          </form>
                        ) : null}
                      </div>
                    );
                  })}
                  {!projectMilestones.length ? <p className="text-sm text-slate-500 dark:text-slate-400">No milestones set for this project yet.</p> : null}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </PortalShell>
  );
}
