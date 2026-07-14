import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { FlashMessage } from "@/components/FlashMessage";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { latestAttemptPerLearner, type SubmittedAttemptRow } from "@/lib/exam-attempts";
import { firstRelation } from "@/lib/relations";
import { gradeEssayAnswerAction } from "./actions";

type ExamRow = { id: string; title: string };

type AttemptRow = SubmittedAttemptRow & {
  profiles: { full_name: string } | { full_name: string }[] | null;
};

type ExamQuestionRow = {
  question_id: string;
  points_override: number | null;
};

type AnswerRow = {
  id: string;
  attempt_id: string;
  question_id: string;
  answer_text: string | null;
  score_awarded: number | null;
  question_bank:
    | { question_text: string; question_type: string; points: number | null }
    | { question_text: string; question_type: string; points: number | null }[]
    | null;
};

export default async function ExamEssayGradingPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const { data: exam } = await supabase.from("exams").select("id, title").eq("id", id).maybeSingle<ExamRow>();
  if (!exam) notFound();

  const [{ data: attempts }, { data: examQuestions }] = await Promise.all([
    supabase
      .from("exam_attempts")
      .select("id, learner_id, submitted_at, profiles(full_name)")
      .eq("exam_id", id)
      .eq("status", "submitted")
      .returns<AttemptRow[]>(),
    supabase.from("exam_questions").select("question_id, points_override").eq("exam_id", id).returns<ExamQuestionRow[]>()
  ]);

  const latestAttempts = latestAttemptPerLearner(attempts ?? []);
  const attemptIds = latestAttempts.map((attempt) => attempt.id);
  const pointsOverrideByQuestion = new Map((examQuestions ?? []).map((row) => [row.question_id, row.points_override]));

  const { data: answers } = attemptIds.length
    ? await supabase
        .from("exam_answers")
        .select("id, attempt_id, question_id, answer_text, score_awarded, question_bank(question_text, question_type, points)")
        .in("attempt_id", attemptIds)
        .returns<AnswerRow[]>()
    : { data: [] as AnswerRow[] };

  const essayAnswers = (answers ?? []).filter((answer) => firstRelation(answer.question_bank)?.question_type === "essay");
  const attemptById = new Map(latestAttempts.map((attempt) => [attempt.id, attempt]));

  const groups = new Map<string, { learnerName: string; answers: AnswerRow[] }>();
  for (const answer of essayAnswers) {
    const attempt = attemptById.get(answer.attempt_id);
    if (!attempt) continue;
    const learnerName = firstRelation(attempt.profiles)?.full_name ?? "Learner";
    if (!groups.has(answer.attempt_id)) groups.set(answer.attempt_id, { learnerName, answers: [] });
    groups.get(answer.attempt_id)!.answers.push(answer);
  }

  return (
    <PortalShell profile={profile}>
      <Link href={`/teacher/exams/${id}/analysis`} className="text-sm font-semibold text-teal-700 hover:text-teal-800">
        Back to item analysis
      </Link>

      <SectionHeader
        eyebrow="Essay Grading"
        title={exam.title}
        description="Review each essay answer and assign a score. Saving updates the learner's exam score and grade automatically."
      />

      <FlashMessage message={query.error} variant="error" className="mb-7" />
      <FlashMessage message={query.message} variant="success" className="mb-7" />

      {!groups.size ? (
        <EmptyState title="No essay answers to grade" message="This exam has no essay questions, or no learner has submitted it yet." />
      ) : (
        <div className="grid gap-6">
          {[...groups.entries()].map(([attemptId, group]) => (
            <div key={attemptId} className="card rounded-[1.75rem] p-6 sm:p-7">
              <h2 className="text-lg font-semibold text-slate-950">{group.learnerName}</h2>
              <div className="mt-5 grid gap-5">
                {group.answers.map((answer) => {
                  const question = firstRelation(answer.question_bank);
                  const maxPoints = pointsOverrideByQuestion.get(answer.question_id) ?? question?.points ?? 1;

                  return (
                    <div key={answer.id} className="rounded-2xl border border-slate-200/80 bg-white/90 p-5">
                      <p className="font-semibold text-slate-900">{question?.question_text ?? "Essay question"}</p>
                      <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {answer.answer_text || "No answer submitted."}
                      </p>
                      <form action={gradeEssayAnswerAction.bind(null, id, answer.id)} className="mt-4 flex flex-wrap items-end gap-3">
                        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                          Score (out of {maxPoints})
                          <input
                            name="score"
                            type="number"
                            min={0}
                            max={maxPoints}
                            step="0.5"
                            defaultValue={answer.score_awarded ?? 0}
                            className="focus-ring min-h-11 w-32 rounded-xl border border-slate-200/80 bg-white px-3 py-2 font-normal text-slate-900 shadow-sm"
                          />
                        </label>
                        <button className="min-h-11 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
                          Save Score
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
