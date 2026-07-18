import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { FlashMessage } from "@/components/FlashMessage";
import { FormInput, FormSelect, FormTextarea } from "@/components/FormFields";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { firstRelation } from "@/lib/relations";
import {
  addMilestoneAction,
  assignLearnerAction,
  deleteMilestoneAction,
  removeAssignmentAction,
  returnMilestoneSubmissionAction,
  scoreMilestoneSubmissionAction,
  setProjectActiveAction,
  updateAssignmentAction,
  updateProjectAction
} from "../actions";

type ProjectRow = {
  id: string;
  title: string;
  overview: string | null;
  competency_id: string | null;
  due_at: string | null;
  is_active: boolean | null;
  rubric: { criteria: { name: string; points: number }[] } | null;
  competencies: { code: string | null; title: string | null } | { code: string | null; title: string | null }[] | null;
};

type MilestoneRow = { id: string; title: string; description: string | null; due_at: string | null; display_order: number };

type AssignmentRow = {
  id: string;
  learner_id: string;
  status: string;
  progress_percentage: number;
  final_score: number | null;
  final_reflection: string | null;
  teacher_comments: string | null;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

type SubmissionRow = {
  id: string;
  milestone_id: string;
  learner_id: string;
  content_text: string | null;
  file_url: string | null;
  status: string;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
};

type LearnerOption = { id: string; full_name: string };

const statusLabels: Record<string, string> = {
  on_track: "On Track",
  delayed: "Delayed",
  needs_intervention: "Needs Intervention",
  completed: "Completed"
};

const statusClasses: Record<string, string> = {
  on_track: "bg-teal-50 text-teal-700 dark:bg-amber-950/40 dark:text-amber-400",
  delayed: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  needs_intervention: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
  completed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
};

export default async function TeacherProjectDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const [{ data: project }, { data: milestones }, { data: assignments }, { data: competencies }, { data: learners }] = await Promise.all([
    supabase.from("projects").select("id, title, overview, competency_id, due_at, is_active, rubric, competencies(code, title)").eq("id", id).maybeSingle<ProjectRow>(),
    supabase.from("project_milestones").select("id, title, description, due_at, display_order").eq("project_id", id).order("display_order").returns<MilestoneRow[]>(),
    supabase.from("project_assignments").select("id, learner_id, status, progress_percentage, final_score, final_reflection, teacher_comments, profiles(full_name)").eq("project_id", id).returns<AssignmentRow[]>(),
    supabase.from("competencies").select("id, code, title, is_active").order("order_index"),
    supabase.from("profiles").select("id, full_name").eq("role", "learner").order("full_name").returns<LearnerOption[]>()
  ]);

  if (!project) notFound();

  const milestoneIds = (milestones ?? []).map((milestone) => milestone.id);
  const { data: submissions } = milestoneIds.length
    ? await supabase
        .from("milestone_submissions")
        .select("id, milestone_id, learner_id, content_text, file_url, status, score, feedback, submitted_at")
        .in("milestone_id", milestoneIds)
        .order("submitted_at", { ascending: false })
        .returns<SubmissionRow[]>()
    : { data: [] as SubmissionRow[] };

  const latestSubmissionByKey = new Map<string, SubmissionRow>();
  for (const submission of submissions ?? []) {
    const key = `${submission.milestone_id}:${submission.learner_id}`;
    if (!latestSubmissionByKey.has(key)) latestSubmissionByKey.set(key, submission);
  }

  const assignedLearnerIds = new Set((assignments ?? []).map((assignment) => assignment.learner_id));
  const availableLearners = (learners ?? []).filter((learner) => !assignedLearnerIds.has(learner.id));
  const competency = firstRelation(project.competencies);
  const nextMilestoneOrder = (milestones ?? []).reduce((highest, milestone) => Math.max(highest, milestone.display_order ?? 0), 0) + 1;

  return (
    <PortalShell profile={profile}>
      <Link href="/teacher/projects" className="text-sm font-semibold text-teal-700 hover:text-teal-800 dark:text-amber-400 active:scale-[0.97]">Back to Projects</Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <SectionHeader eyebrow={competency?.code ?? "EIM"} title={project.title} description={project.overview ?? undefined} />
        <form action={setProjectActiveAction.bind(null, project.id, project.is_active === false)}>
          <button className={project.is_active === false ? "rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-400 dark:hover:bg-amber-950/40" : "rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"}>
            {project.is_active === false ? "Restore Project" : "Archive Project"}
          </button>
        </form>
      </div>

      <FlashMessage message={query.error} variant="error" className="mb-7" />
      <FlashMessage message={query.message} variant="success" className="mb-7" />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <aside className="grid min-w-0 content-start gap-6">
          <section className="card min-w-0 rounded-[1.75rem] p-6 sm:p-7">
            <details>
              <summary className="cursor-pointer list-none text-sm font-semibold text-teal-700 dark:text-amber-400">Edit Project Info</summary>
              <form action={updateProjectAction.bind(null, project.id)} className="mt-4 grid gap-4">
                <FormInput label="Title" name="title" required defaultValue={project.title} />
                <FormTextarea label="Overview" name="overview" defaultValue={project.overview ?? ""} />
                <FormSelect label="Competency" name="competency_id" defaultValue={project.competency_id ?? ""}>
                  <option value="">No competency selected</option>
                  {(competencies ?? []).map((item) => (
                    <option key={item.id} value={item.id}>{item.code} - {item.title}{item.is_active === false ? " (Archived)" : ""}</option>
                  ))}
                </FormSelect>
                <FormInput label="Due Date" name="due_at" type="datetime-local" defaultValue={project.due_at ? project.due_at.slice(0, 16) : ""} />
                <FormTextarea
                  label="Rubric (one criterion per line, Name | Points)"
                  name="rubric"
                  rows={4}
                  defaultValue={(project.rubric?.criteria ?? []).map((c) => `${c.name} | ${c.points}`).join("\n")}
                />
                <button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 active:scale-[0.97]">Save Changes</button>
              </form>
            </details>
          </section>

          <section className="card min-w-0 rounded-[1.75rem] p-6 sm:p-7">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Milestones</h2>
            <div className="mt-4 grid gap-3">
              {(milestones ?? []).map((milestone) => (
                <div key={milestone.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{milestone.title}</p>
                      {milestone.due_at ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Due {formatDateTime(milestone.due_at)}</p> : null}
                      {milestone.description ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{milestone.description}</p> : null}
                    </div>
                    <form action={deleteMilestoneAction.bind(null, project.id, milestone.id)}>
                      <ConfirmSubmitButton message="Remove this milestone?" className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                        Remove
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              ))}
              {!milestones?.length ? <p className="text-sm text-slate-500 dark:text-slate-400">No milestones yet.</p> : null}
            </div>

            <details className="mt-5 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-teal-700 dark:text-amber-400">Add Milestone</summary>
              <form action={addMilestoneAction.bind(null, project.id)} className="grid gap-4 border-t border-slate-100 p-4 dark:border-slate-800">
                <FormInput label="Title" name="title" required />
                <FormTextarea label="Description" name="description" />
                <FormInput label="Due Date" name="due_at" type="datetime-local" />
                <input type="hidden" name="display_order" value={nextMilestoneOrder} />
                <button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 active:scale-[0.97]">Add Milestone</button>
              </form>
            </details>
          </section>

          <section className="card min-w-0 rounded-[1.75rem] p-6 sm:p-7">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Assign Learner</h2>
            {availableLearners.length ? (
              <form action={assignLearnerAction.bind(null, project.id)} className="mt-4 grid gap-4">
                <FormSelect label="Learner" name="learner_id" required defaultValue="">
                  <option value="">Select learner</option>
                  {availableLearners.map((learner) => (
                    <option key={learner.id} value={learner.id}>{learner.full_name}</option>
                  ))}
                </FormSelect>
                <button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 active:scale-[0.97]">Assign</button>
              </form>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">All your learners are already assigned, or none are available.</p>
            )}
          </section>
        </aside>

        <section className="grid min-w-0 content-start gap-5">
          {!assignments?.length ? (
            <div className="card rounded-[1.75rem] p-8 text-center text-slate-500 dark:text-slate-400">No learners assigned to this project yet.</div>
          ) : (
            assignments.map((assignment) => {
              const learner = firstRelation(assignment.profiles);

              return (
                <details key={assignment.id} className="card rounded-[1.75rem] p-6 sm:p-7">
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{learner?.full_name ?? "Learner"}</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{assignment.progress_percentage}% complete{assignment.final_score !== null ? ` · Final score: ${assignment.final_score}` : ""}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[assignment.status] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                        {statusLabels[assignment.status] ?? assignment.status}
                      </span>
                    </div>
                  </summary>

                  <div className="mt-6 grid gap-6 border-t border-slate-100 pt-6 dark:border-slate-800">
                    <div className="grid gap-4">
                      {(milestones ?? []).map((milestone) => {
                        const submission = latestSubmissionByKey.get(`${milestone.id}:${assignment.learner_id}`);

                        return (
                          <div key={milestone.id} className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-700/80 dark:bg-slate-900/90">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{milestone.title}</p>
                            {!submission ? (
                              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Not submitted yet.</p>
                            ) : (
                              <>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Submitted {formatDateTime(submission.submitted_at)} &middot; {submission.status}</p>
                                {submission.file_url ? <a href={submission.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-teal-700 hover:underline dark:text-amber-400">Open evidence link</a> : null}
                                {submission.content_text ? <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">{submission.content_text}</p> : null}
                                <form action={scoreMilestoneSubmissionAction.bind(null, project.id)} className="mt-3 grid gap-3 sm:grid-cols-[100px_1fr_auto] sm:items-end">
                                  <input type="hidden" name="submission_id" value={submission.id} />
                                  <label className="grid gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    Score
                                    <input name="score" type="number" min={0} defaultValue={submission.score ?? 0} className="focus-ring min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-normal dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                                  </label>
                                  <label className="grid gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    Feedback
                                    <input name="feedback" defaultValue={submission.feedback ?? ""} className="focus-ring min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-normal dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                                  </label>
                                  <div className="flex gap-2">
                                    <button type="submit" className="min-h-10 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 active:scale-[0.97]">Save</button>
                                    <button type="submit" formAction={returnMilestoneSubmissionAction.bind(null, project.id)} className="min-h-10 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300 active:scale-[0.97]">
                                      Return
                                    </button>
                                  </div>
                                </form>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <form action={updateAssignmentAction.bind(null, project.id, assignment.id)} className="grid gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 dark:border-slate-700/80 dark:bg-slate-800/60">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <FormSelect label="Status" name="status" defaultValue={assignment.status}>
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </FormSelect>
                        <FormInput label="Progress %" name="progress_percentage" type="number" min={0} max={100} defaultValue={assignment.progress_percentage} />
                        <FormInput label="Final Score" name="final_score" type="number" min={0} defaultValue={assignment.final_score ?? ""} />
                      </div>
                      <FormTextarea label="Teacher Comments" name="teacher_comments" defaultValue={assignment.teacher_comments ?? ""} />
                      <button className="w-fit rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 active:scale-[0.97]">Save Progress</button>
                    </form>
                    <form action={removeAssignmentAction.bind(null, project.id, assignment.id)}>
                      <ConfirmSubmitButton message="Remove this learner from the project?" className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30">
                        Remove Learner
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </details>
              );
            })
          )}
        </section>
      </div>
    </PortalShell>
  );
}
