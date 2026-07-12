import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { EmptyState } from "@/components/EmptyState";
import { FormInput, FormSelect, SubmitButton } from "@/components/FormFields";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { firstRelation } from "@/lib/relations";
import { addExamQuestionAction, removeExamQuestionAction, updateExamQuestionAction } from "./actions";

type Question = {
  id: string;
  question_text: string;
  question_type: string;
  points: number | null;
  difficulty: string | null;
  is_active: boolean | null;
  competencies: { code: string | null; title: string | null } | { code: string | null; title: string | null }[] | null;
};

type ExamQuestionRow = {
  id: string;
  order_index: number;
  points_override: number | null;
  question_bank: Question | Question[] | null;
};

type ExamRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  duration_minutes: number | null;
  competencies: { code: string | null; title: string | null } | { code: string | null; title: string | null }[] | null;
};

export default async function ExamBuilderPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, title, description, status, duration_minutes, competencies(code, title)")
    .eq("id", id)
    .single()
    .returns<ExamRow>();

  if (!exam) notFound();

  const [assignedResult, bankResult] = await Promise.all([
    supabase
      .from("exam_questions")
      .select("id, order_index, points_override, question_bank(id, question_text, question_type, points, difficulty, is_active, competencies(code, title))")
      .eq("exam_id", id)
      .order("order_index")
      .returns<ExamQuestionRow[]>(),
    supabase
      .from("question_bank")
      .select("id, question_text, question_type, points, difficulty, is_active, competencies(code, title)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .returns<Question[]>()
  ]);

  const assigned = assignedResult.data ?? [];
  const assignedIds = new Set(assigned.flatMap((row) => {
    const question = firstRelation(row.question_bank);
    return question?.id ? [question.id] : [];
  }));
  const available = (bankResult.data ?? []).filter((question) => !assignedIds.has(question.id));
  const totalPoints = assigned.reduce((sum, row) => {
    const question = firstRelation(row.question_bank);
    return sum + Number(row.points_override ?? question?.points ?? 1);
  }, 0);
  const competency = firstRelation(exam.competencies);

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Exam Builder" title={exam.title} description="Add, remove, reorder, and score questions for this exam." />

      <div className="mb-7 flex flex-wrap gap-3">
        <Link href="/teacher/exams" className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">Back to Exams</Link>
        <Link href="/teacher/question-bank" className="rounded-2xl border border-teal-200 bg-white/70 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50">Question Bank</Link>
        <Link href={`/teacher/exams/${id}/analysis`} className="rounded-2xl border border-amber-200 bg-white/70 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50">Item Analysis</Link>
      </div>

      {query.message ? <div className="mb-7 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 font-semibold text-teal-800">{query.message}</div> : null}

      <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="card rounded-[1.75rem] p-7 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{competency?.code ?? "EIM"} / {exam.status}</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">Exam Setup</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{exam.description}</p>
          <div className="mt-6 grid gap-2.5 text-sm text-slate-600">
            <p>Duration: {exam.duration_minutes ?? 30} minutes</p>
            <p>Questions: {assigned.length}</p>
            <p>Total points: {totalPoints}</p>
          </div>

          <form action={addExamQuestionAction.bind(null, id)} className="mt-7 grid gap-5">
            <FormSelect label="Add from question bank" name="question_id" required>
              <option value="">Select active question</option>
              {available.map((question) => {
                const itemCompetency = firstRelation(question.competencies);
                return (
                  <option key={question.id} value={question.id}>
                    {(itemCompetency?.code ?? "EIM")} / {question.question_text.slice(0, 80)}
                  </option>
                );
              })}
            </FormSelect>
            <SubmitButton>Add Question</SubmitButton>
          </form>
        </aside>

        <section className="grid gap-5">
          {!assigned.length ? (
            <EmptyState title="No questions attached" message="Add active questions from the bank to assemble this exam." />
          ) : assigned.map((row, index) => {
            const question = firstRelation(row.question_bank);
            if (!question) return null;
            const points = Number(row.points_override ?? question.points ?? 1);
            const questionCompetency = firstRelation(question.competencies);

            return (
              <div key={row.id} className="card rounded-[1.75rem] p-6 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Question {index + 1} / {question.question_type} / {questionCompetency?.code ?? "EIM"}</p>
                    <h3 className="mt-2 text-lg font-semibold leading-7 text-slate-950">{question.question_text}</h3>
                    <p className="mt-3 text-sm text-slate-500">{points} pt{points === 1 ? "" : "s"} / {question.difficulty ?? "average"}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 md:flex-row md:items-end">
                  <form action={updateExamQuestionAction.bind(null, id, row.id)} className="grid flex-1 gap-4 md:grid-cols-3">
                    <FormInput label="Order" name="order_index" type="number" defaultValue={row.order_index} />
                    <FormInput label="Points override" name="points_override" type="number" defaultValue={row.points_override ?? ""} placeholder={String(question.points ?? 1)} />
                    <SubmitButton className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700 md:self-end">Update</SubmitButton>
                  </form>
                  <form action={removeExamQuestionAction.bind(null, id, row.id)}>
                    <ConfirmSubmitButton message="Remove this question from the exam?" className="rounded-2xl border border-red-200 px-5 py-3 font-semibold text-red-700 hover:bg-red-50">
                      Remove
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </PortalShell>
  );
}
