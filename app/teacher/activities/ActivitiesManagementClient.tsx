"use client";

import { useState } from "react";
import { FormInput, FormSelect, FormTextarea, SubmitButton } from "@/components/FormFields";
import { Modal } from "@/components/ui/Modal";
import { createActivityAction, setActivityActiveAction, updateActivityAction } from "./actions";

export type RubricCriterion = { name: string; points: number };

export type ManagedActivity = {
  id: string;
  title: string;
  instructions: string | null;
  lessonId: string | null;
  lessonTitle: string | null;
  dueAt: string | null;
  maxScore: number;
  submissionType: string;
  rubric: RubricCriterion[] | null;
  isActive: boolean;
  submissionCount: number;
};

export type LessonOption = { id: string; title: string };

const submissionTypeLabels: Record<string, string> = {
  link_or_text: "Link or text",
  text_only: "Text only",
  file_link: "File link",
  image_link: "Image link",
  video_link: "Video link"
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function rubricToText(rubric: RubricCriterion[] | null) {
  if (!rubric?.length) return "";
  return rubric.map((criterion) => `${criterion.name} | ${criterion.points}`).join("\n");
}

function ActivityForm({ activity, lessons, onSubmit }: { activity?: ManagedActivity; lessons: LessonOption[]; onSubmit?: () => void }) {
  return (
    <form action={activity ? updateActivityAction.bind(null, activity.id) : createActivityAction} onSubmit={onSubmit} className="grid gap-5">
      <FormInput label="Title" name="title" required defaultValue={activity?.title} placeholder="Wire a duplex convenience outlet" />
      <FormTextarea label="Instructions" name="instructions" defaultValue={activity?.instructions ?? ""} placeholder="What should the learner do and submit?" />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormSelect label="Related Lesson (optional)" name="lesson_id" defaultValue={activity?.lessonId ?? ""}>
          <option value="">No lesson linked</option>
          {lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
          ))}
        </FormSelect>
        <FormSelect label="Submission Type" name="submission_type" defaultValue={activity?.submissionType ?? "link_or_text"}>
          {Object.entries(submissionTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </FormSelect>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput label="Due Date" name="due_at" type="datetime-local" defaultValue={toDatetimeLocal(activity?.dueAt ?? null)} />
        <FormInput label="Max Score" name="max_score" type="number" min={1} defaultValue={activity?.maxScore ?? 100} />
      </div>
      <FormTextarea
        label="Rubric (optional — one criterion per line, formatted as Name | Points)"
        name="rubric"
        rows={4}
        defaultValue={rubricToText(activity?.rubric ?? null)}
        placeholder={"Safety compliance | 10\nCorrect wiring | 20\nNeatness | 10"}
      />
      <SubmitButton>{activity ? "Save Changes" : "Create Activity"}</SubmitButton>
    </form>
  );
}

export function ActivitiesManagementClient({ activities, lessons }: { activities: ManagedActivity[]; lessons: LessonOption[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedActivity | null>(null);

  return (
    <>
      <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Activities</h2>
            <p className="mt-1 text-sm text-slate-500">{activities.length} activit{activities.length === 1 ? "y" : "ies"} shown</p>
          </div>
          <button type="button" onClick={() => setIsAddOpen(true)} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-teal-700">
            Add Activity
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-5 py-3.5">Title</th>
                <th className="border-b border-slate-200 px-4 py-3.5">Lesson</th>
                <th className="border-b border-slate-200 px-4 py-3.5">Due</th>
                <th className="border-b border-slate-200 px-4 py-3.5">Type</th>
                <th className="border-b border-slate-200 px-4 py-3.5 text-center">Max Score</th>
                <th className="border-b border-slate-200 px-4 py-3.5 text-center">Submissions</th>
                <th className="border-b border-slate-200 px-4 py-3.5">Status</th>
                <th className="border-b border-slate-200 px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} className="text-slate-700 hover:bg-slate-50/60">
                  <td className="border-b border-slate-200/70 px-5 py-4 font-semibold text-slate-950">{activity.title}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4">{activity.lessonTitle ?? "Not linked"}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4 tabular-nums">{activity.dueAt ? new Date(activity.dueAt).toLocaleDateString("en-PH", { dateStyle: "medium" }) : "No due date"}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4">{submissionTypeLabels[activity.submissionType] ?? activity.submissionType}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4 text-center tabular-nums">{activity.maxScore}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4 text-center tabular-nums">{activity.submissionCount}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4">
                    <span className={activity.isActive ? "rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"}>
                      {activity.isActive ? "Active" : "Archived"}
                    </span>
                  </td>
                  <td className="border-b border-slate-200/70 px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditing(activity)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-teal-700">Edit</button>
                      <form action={setActivityActiveAction.bind(null, activity.id, !activity.isActive)}>
                        <button className={activity.isActive ? "rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50" : "rounded-lg px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50"}>
                          {activity.isActive ? "Archive" : "Restore"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!activities.length ? <div className="m-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center text-slate-500">No activities match this filter.</div> : null}
      </section>

      {isAddOpen ? (
        <Modal title="Add Activity" description="Create an output task learners can submit against." onClose={() => setIsAddOpen(false)} size="lg">
          <ActivityForm lessons={lessons} onSubmit={() => setIsAddOpen(false)} />
        </Modal>
      ) : null}
      {editing ? (
        <Modal title={`Edit ${editing.title}`} onClose={() => setEditing(null)} size="lg">
          <ActivityForm activity={editing} lessons={lessons} onSubmit={() => setEditing(null)} />
        </Modal>
      ) : null}
    </>
  );
}
