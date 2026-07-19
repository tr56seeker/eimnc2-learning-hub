import Link from "next/link";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { EmptyState } from "@/components/EmptyState";
import { FlashMessage } from "@/components/FlashMessage";
import { FormInput, FormSelect, FormTextarea, SubmitButton } from "@/components/FormFields";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { firstRelation } from "@/lib/relations";
import { createExamAction, deleteExamAction, setExamStatusAction, updateExamAction } from "./actions";

type ExamRow = {
  id: string;
  competency_id: string | null;
  lesson_id: string | null;
  title: string;
  description: string | null;
  status: "draft" | "published" | "closed";
  duration_minutes: number | null;
  start_at: string | null;
  end_at: string | null;
  randomize_questions: boolean;
  randomize_choices: boolean | null;
  show_result_after_submit: boolean | null;
  show_score_after_submit: boolean | null;
  allow_review_after_close: boolean | null;
  max_violations: number | null;
  competencies: { code: string | null; title: string | null } | { code: string | null; title: string | null }[] | null;
  exam_questions: { id: string }[] | null;
};

function toDateInput(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
}

function ExamForm({
  action,
  competencies,
  lessons,
  exam,
  submitLabel
}: {
  action: (formData: FormData) => void;
  competencies: { id: string; code: string; title: string; is_active?: boolean | null }[];
  lessons: { id: string; title: string }[];
  exam?: ExamRow;
  submitLabel: string;
}) {
  const showResult = exam?.show_result_after_submit ?? exam?.show_score_after_submit ?? true;

  return (
    <form action={action} className="grid gap-5">
      <FormInput label="Title" name="title" required defaultValue={exam?.title} />
      <FormTextarea label="Description" name="description" rows={3} defaultValue={exam?.description} />
      <FormSelect label="Competency" name="competency_id" defaultValue={exam?.competency_id ?? ""}>
        <option value="">No competency</option>
        {competencies.map((competency) => (
          <option key={competency.id} value={competency.id}>{competency.code} - {competency.title}{competency.is_active === false ? " (Archived)" : ""}</option>
        ))}
      </FormSelect>
      <FormSelect label="Lesson (optional — scopes this as a per-topic quiz)" name="lesson_id" defaultValue={exam?.lesson_id ?? ""}>
        <option value="">No specific lesson</option>
        {lessons.map((lesson) => (
          <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
        ))}
      </FormSelect>
      <div className="grid gap-5 md:grid-cols-3">
        <FormInput label="Duration minutes" name="duration_minutes" type="number" required defaultValue={exam?.duration_minutes ?? 30} />
        <FormInput label="Opens" name="start_at" type="datetime-local" defaultValue={toDateInput(exam?.start_at ?? null)} />
        <FormInput label="Closes" name="end_at" type="datetime-local" defaultValue={toDateInput(exam?.end_at ?? null)} />
      </div>
      <FormInput
        label="Max violations before auto-submit (1-5)"
        name="max_violations"
        type="number"
        min={1}
        max={5}
        required
        defaultValue={exam?.max_violations ?? 3}
      />
      <div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-white/75 p-4 text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/40 dark:border-slate-700/70 dark:bg-slate-900/75 dark:text-slate-300 dark:shadow-black/20 md:grid-cols-2">
        <label className="flex items-center gap-3"><input name="is_published" type="checkbox" defaultChecked={exam?.status === "published"} /> Published</label>
        <label className="flex items-center gap-3"><input name="randomize_questions" type="checkbox" defaultChecked={exam?.randomize_questions ?? false} /> Randomize questions</label>
        <label className="flex items-center gap-3"><input name="randomize_choices" type="checkbox" defaultChecked={exam?.randomize_choices ?? false} /> Randomize choices</label>
        <label className="flex items-center gap-3"><input name="show_result_after_submit" type="checkbox" defaultChecked={showResult} /> Show result after submit</label>
        <label className="flex items-center gap-3"><input name="allow_review_after_close" type="checkbox" defaultChecked={exam?.allow_review_after_close ?? false} /> Allow review after close</label>
      </div>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

export default async function TeacherExamsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const [competenciesResult, lessonsResult, examsResult] = await Promise.all([
    supabase.from("competencies").select("id, code, title, is_active").order("order_index"),
    supabase.from("lessons").select("id, title").order("title"),
    supabase
      .from("exams")
      .select("id, competency_id, lesson_id, title, description, status, duration_minutes, start_at, end_at, randomize_questions, randomize_choices, show_result_after_submit, show_score_after_submit, allow_review_after_close, max_violations, competencies(code, title), exam_questions(id)")
      .order("created_at", { ascending: false })
      .returns<ExamRow[]>()
  ]);

  const competencies = competenciesResult.data ?? [];
  const lessons = lessonsResult.data ?? [];
  const exams = examsResult.data ?? [];

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Exam Manager" description="Create, schedule, publish, and open the builder for EIM exams." />

      <FlashMessage message={params.error} variant="error" className="mb-7" />
      <FlashMessage message={params.message} variant="success" className="mb-7" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <section className="card min-w-0 rounded-[1.75rem] p-7 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">Create Exam</h2>
          <div className="mt-7">
            <ExamForm action={createExamAction} competencies={competencies} lessons={lessons} submitLabel="Create Exam" />
          </div>
        </section>

        <section className="grid min-w-0 gap-5">
          {!exams.length ? (
            <EmptyState title="No exams yet" message="Create an exam, then add questions from the builder." />
          ) : exams.map((exam) => {
            const competency = firstRelation(exam.competencies);
            const questionCount = exam.exam_questions?.length ?? 0;
            const linkedLesson = lessons.find((lesson) => lesson.id === exam.lesson_id);

            return (
              <details key={exam.id} className="card rounded-[1.75rem] p-6 sm:p-7">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-amber-400">{competency?.code ?? "EIM"} / {exam.status}</p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">{exam.title}</h2>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{exam.description}</p>
                      {linkedLesson ? (
                        <p className="mt-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                          Topic quiz for: {linkedLesson.title}
                        </p>
                      ) : null}
                    </div>
                    <Link href={`/teacher/exams/${exam.id}/builder`} className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:bg-teal-700">
                      Builder
                    </Link>
                  </div>
                  <div className="mt-6 grid gap-2.5 text-sm leading-6 text-slate-500 dark:text-slate-400 md:grid-cols-2">
                    <p><strong>Questions:</strong> {questionCount}</p>
                    <p><strong>Duration:</strong> {exam.duration_minutes ?? 30} minutes</p>
                    <p><strong>Opens:</strong> {formatDateTime(exam.start_at)}</p>
                    <p><strong>Closes:</strong> {formatDateTime(exam.end_at)}</p>
                  </div>
                </summary>
                <div className="mt-7 grid gap-6 border-t border-slate-100 pt-6 dark:border-slate-800">
                  <ExamForm action={updateExamAction.bind(null, exam.id)} competencies={competencies} lessons={lessons} exam={exam} submitLabel="Save Exam" />
                  <div className="flex flex-wrap gap-3">
                    <form action={setExamStatusAction.bind(null, exam.id, exam.status === "published" ? "draft" : "published")}>
                      <SubmitButton className="rounded-2xl border border-teal-200 px-5 py-3 font-semibold text-teal-700 hover:bg-teal-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/40 active:scale-[0.97]">
                        {exam.status === "published" ? "Unpublish" : "Publish"}
                      </SubmitButton>
                    </form>
                    <form action={deleteExamAction.bind(null, exam.id)}>
                      <ConfirmSubmitButton message="Delete this exam and its question links?" className="rounded-2xl border border-red-200 px-5 py-3 font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30">
                        Delete Exam
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </details>
            );
          })}
        </section>
      </div>
    </PortalShell>
  );
}
