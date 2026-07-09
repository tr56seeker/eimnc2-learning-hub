import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { EmptyState } from "@/components/EmptyState";
import { FormInput, FormSelect, FormTextarea, SubmitButton } from "@/components/FormFields";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { firstRelation } from "@/lib/relations";
import { createQuestionAction, deleteQuestionAction, updateQuestionAction } from "./actions";

type Choice = { label: string; value: string };
type QuestionRow = {
  id: string;
  competency_id: string | null;
  question_text: string;
  question_type: string;
  choices: Choice[] | null;
  correct_answer: string | null;
  points: number | null;
  difficulty: string;
  explanation: string | null;
  is_active: boolean | null;
  competencies: { code: string | null; title: string | null } | { code: string | null; title: string | null }[] | null;
};

function choicesText(choices: Choice[] | null) {
  return (choices ?? []).map((choice) => `${choice.value}|${choice.label.replace(new RegExp(`^${choice.value}\\.\\s*`), "")}`).join("\n");
}

function QuestionForm({
  action,
  competencies,
  question,
  submitLabel
}: {
  action: (formData: FormData) => void;
  competencies: { id: string; code: string; title: string }[];
  question?: QuestionRow;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-5">
      <FormSelect label="Competency" name="competency_id" defaultValue={question?.competency_id ?? ""}>
        <option value="">No competency</option>
        {competencies.map((competency) => (
          <option key={competency.id} value={competency.id}>{competency.code} - {competency.title}</option>
        ))}
      </FormSelect>
      <FormTextarea label="Question" name="question_text" required rows={3} defaultValue={question?.question_text} />
      <div className="grid gap-5 md:grid-cols-3">
        <FormSelect label="Type" name="question_type" required defaultValue={question?.question_type ?? "multiple_choice"}>
          <option value="multiple_choice">Multiple choice</option>
          <option value="true_false">True / False</option>
          <option value="identification">Identification</option>
          <option value="essay">Essay</option>
        </FormSelect>
        <FormSelect label="Difficulty" name="difficulty" required defaultValue={question?.difficulty ?? "average"}>
          <option value="easy">Easy</option>
          <option value="average">Average</option>
          <option value="hots">HOTS</option>
        </FormSelect>
        <FormInput label="Points" name="points" type="number" defaultValue={question?.points ?? 1} required />
      </div>
      <FormTextarea label="Choices" name="choices" rows={4} defaultValue={choicesText(question?.choices ?? null)} placeholder="For multiple choice, one per line: A|Safety goggles" />
      <FormInput label="Correct answer" name="correct_answer" defaultValue={question?.correct_answer} placeholder="A, true, or exact identification answer" />
      <FormTextarea label="Explanation" name="explanation" rows={3} defaultValue={question?.explanation} placeholder="Optional feedback shown to teachers for now" />
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-sm font-medium text-slate-700">
        <input name="is_active" type="checkbox" defaultChecked={question?.is_active ?? true} /> Active in question bank
      </label>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

export default async function TeacherQuestionBankPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const [competenciesResult, questionsResult] = await Promise.all([
    supabase.from("competencies").select("id, code, title").order("order_index"),
    supabase
      .from("question_bank")
      .select("id, competency_id, question_text, question_type, choices, correct_answer, points, difficulty, explanation, is_active, competencies(code, title)")
      .order("created_at", { ascending: false })
      .returns<QuestionRow[]>()
  ]);

  const competencies = competenciesResult.data ?? [];
  const questions = questionsResult.data ?? [];
  const grouped = questions.reduce<Record<string, QuestionRow[]>>((groups, question) => {
    const competency = firstRelation(question.competencies);
    const label = competency?.code ? `${competency.code} - ${competency.title ?? "Untitled"}` : "Unassigned";
    groups[label] = [...(groups[label] ?? []), question];
    return groups;
  }, {});

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Question Bank" description="Create reusable EIM questions for quizzes and exams." />

      {params.message ? <div className="mb-7 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 font-semibold text-teal-800">{params.message}</div> : null}

      <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
        <section className="card rounded-[1.75rem] p-7 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-950">Add Question</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Keep questions concise and reusable across exams.</p>
          <div className="mt-7">
            <QuestionForm action={createQuestionAction} competencies={competencies} submitLabel="Add Question" />
          </div>
        </section>

        <section className="grid gap-6">
          {!questions.length ? (
            <EmptyState title="No questions yet" message="Add your first question to start building exams." />
          ) : Object.entries(grouped).map(([group, groupQuestions]) => (
            <div key={group} className="card rounded-[1.75rem] p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">{group}</h2>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                  {groupQuestions.length} question{groupQuestions.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-5 grid gap-4">
                {groupQuestions.map((question) => (
                  <details key={question.id} className="rounded-[1.35rem] border border-slate-200/70 bg-white/82 p-5 shadow-sm shadow-slate-200/40">
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{question.question_type} / {question.difficulty}</p>
                          <h3 className="mt-2 text-base font-semibold leading-7 text-slate-950">{question.question_text}</h3>
                        </div>
                        <p className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{question.points ?? 1} pt{Number(question.points ?? 1) === 1 ? "" : "s"} / {question.is_active ? "Active" : "Inactive"}</p>
                      </div>
                    </summary>
                    <div className="mt-6 grid gap-6 border-t border-slate-100 pt-6">
                      <QuestionForm action={updateQuestionAction.bind(null, question.id)} competencies={competencies} question={question} submitLabel="Save Changes" />
                      <form action={deleteQuestionAction.bind(null, question.id)}>
                        <ConfirmSubmitButton message="Delete this question? It cannot be used in future exams." className="rounded-2xl border border-red-200 px-5 py-3 font-semibold text-red-700 hover:bg-red-50">
                          Delete Question
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </PortalShell>
  );
}
