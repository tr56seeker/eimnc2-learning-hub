import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { firstRelation } from "@/lib/relations";

type ExamRow = {
  id: string;
  title: string;
  status: string;
};

type ExamQuestionRow = {
  order_index: number;
  question_id: string;
  question_bank: { id: string; question_text: string; question_type: string; difficulty: string | null } | { id: string; question_text: string; question_type: string; difficulty: string | null }[] | null;
};

type AnswerRow = {
  question_id: string;
  is_correct: boolean | null;
  attempt_id: string;
};

function difficultyLabel(percentCorrect: number | null) {
  if (percentCorrect === null) return { label: "No data", color: "text-slate-400", bar: "bg-slate-200" };
  if (percentCorrect >= 80) return { label: "Easy", color: "text-emerald-700", bar: "bg-emerald-500" };
  if (percentCorrect >= 50) return { label: "Average", color: "text-amber-700", bar: "bg-amber-500" };
  return { label: "Difficult", color: "text-red-700", bar: "bg-red-500" };
}

export default async function ExamItemAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, supabase } = await requireTeacher();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, title, status")
    .eq("id", id)
    .single<ExamRow>();

  if (!exam) notFound();

  const [{ data: examQuestions }, { data: submittedAttempts }] = await Promise.all([
    supabase
      .from("exam_questions")
      .select("order_index, question_id, question_bank(id, question_text, question_type, difficulty)")
      .eq("exam_id", id)
      .order("order_index")
      .returns<ExamQuestionRow[]>(),
    supabase.from("exam_attempts").select("id").eq("exam_id", id).eq("status", "submitted")
  ]);

  const submittedAttemptIds = (submittedAttempts ?? []).map((attempt) => attempt.id);
  const totalSubmitted = submittedAttemptIds.length;

  const { data: answers } = submittedAttemptIds.length
    ? await supabase
        .from("exam_answers")
        .select("question_id, is_correct, attempt_id")
        .in("attempt_id", submittedAttemptIds)
        .returns<AnswerRow[]>()
    : { data: [] as AnswerRow[] };

  const statsByQuestion = new Map<string, { answered: number; correct: number }>();
  for (const answer of answers ?? []) {
    const entry = statsByQuestion.get(answer.question_id) ?? { answered: 0, correct: 0 };
    entry.answered += 1;
    if (answer.is_correct) entry.correct += 1;
    statsByQuestion.set(answer.question_id, entry);
  }

  const rows = (examQuestions ?? []).map((row) => {
    const question = firstRelation(row.question_bank);
    const stats = statsByQuestion.get(row.question_id);
    const percentCorrect = stats && stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : null;

    return {
      questionId: row.question_id,
      text: question?.question_text ?? "Question",
      type: question?.question_type ?? "unknown",
      answered: stats?.answered ?? 0,
      correct: stats?.correct ?? 0,
      percentCorrect
    };
  });

  return (
    <PortalShell profile={profile}>
      <Link href={`/teacher/exams/${id}/builder`} className="text-sm font-semibold text-teal-700 hover:text-teal-800">
        Back to exam builder
      </Link>

      <SectionHeader
        eyebrow="Item Analysis"
        title={exam.title}
        description={`${totalSubmitted} submitted attempt${totalSubmitted === 1 ? "" : "s"} analyzed. Difficulty is based on the percentage of learners who answered each question correctly.`}
      />

      {!rows.length ? (
        <EmptyState title="No questions in this exam" message="Add questions in the exam builder first." />
      ) : totalSubmitted === 0 ? (
        <EmptyState title="No submitted attempts yet" message="Item analysis will appear once learners submit this exam." />
      ) : (
        <div className="grid gap-4">
          {rows.map((row, index) => {
            const difficulty = difficultyLabel(row.percentCorrect);
            const isEssayOrIdentification = row.type === "essay";

            return (
              <div key={row.questionId} className="card rounded-[1.5rem] p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="max-w-2xl font-semibold text-slate-950">Q{index + 1}. {row.text}</p>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${difficulty.color} border-current/20`}>
                    {difficulty.label}
                  </span>
                </div>

                {isEssayOrIdentification ? (
                  <p className="mt-4 text-sm font-medium text-slate-500">Essay question — not auto-scored, excluded from correctness stats.</p>
                ) : (
                  <>
                    <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${difficulty.bar}`}
                        style={{ width: `${row.percentCorrect ?? 0}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      {row.percentCorrect ?? 0}% correct &middot; {row.correct}/{row.answered} learners got this right
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PortalShell>
  );
}
