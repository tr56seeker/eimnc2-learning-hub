import Link from "next/link";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { EmptyState } from "@/components/EmptyState";
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
  exam,
  submitLabel
}: {
  action: (formData: FormData) => void;
  competencies: { id: string; code: string; title: string }[];
  exam?: ExamRow;
  submitLabel: string;
}) {
  const showResult = exam?.show_result_after_submit ?? exam?.show_score_after_submit ?? true;

  return (
    <form action={action} className="grid gap-4">
      <FormInput label="Title" name="title" required defaultValue={exam?.title} />
      <FormTextarea label="Description" name="description" rows={3} defaultValue={exam?.description} />
      <FormSelect label="Competency" name="competency_id" defaultValue={exam?.competency_id ?? ""}>
        <option value="">No competency</option>
        {competencies.map((competency) => (
          <option key={competency.id} value={competency.id}>{competency.code} - {competency.title}</option>
        ))}
      </FormSelect>
      <div className="grid gap-4 md:grid-cols-3">
        <FormInput label="Duration minutes" name="duration_minutes" type="number" required defaultValue={exam?.duration_minutes ?? 30} />
        <FormInput label="Opens" name="start_at" type="datetime-local" defaultValue={toDateInput(exam?.start_at ?? null)} />
        <FormInput label="Closes" name="end_at" type="datetime-local" defaultValue={toDateInput(exam?.end_at ?? null)} />
      </div>
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 md:grid-cols-2">
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

export default async function TeacherExamsPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const [competenciesResult, examsResult] = await Promise.all([
    supabase.from("competencies").select("id, code, title").order("order_index"),
    supabase
      .from("exams")
      .select("id, competency_id, title, description, status, duration_minutes, start_at, end_at, randomize_questions, randomize_choices, show_result_after_submit, show_score_after_submit, allow_review_after_close, competencies(code, title), exam_questions(id)")
      .order("created_at", { ascending: false })
      .returns<ExamRow[]>()
  ]);

  const competencies = competenciesResult.data ?? [];
  const exams = examsResult.data ?? [];

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Exam Manager" description="Create, schedule, publish, and open the builder for EIM exams." />

      {params.message ? <div className="mb-5 rounded-2xl border border-teal-200 bg-teal-50 p-4 font-bold text-teal-800">{params.message}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="card rounded-[2rem] p-6">
          <h2 className="text-xl font-black text-slate-950">Create Exam</h2>
          <div className="mt-5">
            <ExamForm action={createExamAction} competencies={competencies} submitLabel="Create Exam" />
          </div>
        </section>

        <section className="grid gap-4">
          {!exams.length ? (
            <EmptyState title="No exams yet" message="Create an exam, then add questions from the builder." />
          ) : exams.map((exam) => {
            const competency = firstRelation(exam.competencies);
            const questionCount = exam.exam_questions?.length ?? 0;

            return (
              <details key={exam.id} className="card rounded-[2rem] p-6">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">{competency?.code ?? "EIM"} · {exam.status}</p>
                      <h2 className="mt-2 text-2xl font-black text-slate-950">{exam.title}</h2>
                      <p className="mt-2 text-sm text-slate-600">{exam.description}</p>
                    </div>
                    <Link href={`/teacher/exams/${exam.id}/builder`} className="rounded-2xl bg-teal-700 px-4 py-3 text-center text-sm font-black text-white hover:bg-teal-800">
                      Builder
                    </Link>
                  </div>
                  <div className="mt-5 grid gap-2 text-sm text-slate-500 md:grid-cols-2">
                    <p><strong>Questions:</strong> {questionCount}</p>
                    <p><strong>Duration:</strong> {exam.duration_minutes ?? 30} minutes</p>
                    <p><strong>Opens:</strong> {formatDateTime(exam.start_at)}</p>
                    <p><strong>Closes:</strong> {formatDateTime(exam.end_at)}</p>
                  </div>
                </summary>
                <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5">
                  <ExamForm action={updateExamAction.bind(null, exam.id)} competencies={competencies} exam={exam} submitLabel="Save Exam" />
                  <div className="flex flex-wrap gap-3">
                    <form action={setExamStatusAction.bind(null, exam.id, exam.status === "published" ? "draft" : "published")}>
                      <SubmitButton className="rounded-2xl border border-teal-200 px-5 py-3 font-black text-teal-700 hover:bg-teal-50">
                        {exam.status === "published" ? "Unpublish" : "Publish"}
                      </SubmitButton>
                    </form>
                    <form action={deleteExamAction.bind(null, exam.id)}>
                      <ConfirmSubmitButton message="Delete this exam and its question links?" className="rounded-2xl border border-red-200 px-5 py-3 font-black text-red-700 hover:bg-red-50">
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
