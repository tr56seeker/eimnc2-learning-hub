import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { ExamTimer } from "@/components/ExamTimer";
import { ExamIntegrityGuard } from "@/components/ExamIntegrityGuard";
import { FlashMessage } from "@/components/FlashMessage";
import { requireLearner } from "@/lib/auth";
import { submitExamAction } from "../actions";

type QuestionRow = {
  order_index: number;
  points_override: number | null;
  question_id: string;
  question_text: string;
  question_type: string;
  choices: ({ label: string; value: string } | { key: string; text: string })[] | null;
  points: number | null;
};

function shuffleItems<T>(items: T[], enabled: boolean) {
  if (!enabled) return items;
  return [...items].sort(() => Math.random() - 0.5);
}

function normalizedChoice(choice: { label: string; value: string } | { key: string; text: string }) {
  if ("value" in choice) return choice;
  return { value: choice.key, label: `${choice.key.length === 1 ? `${choice.key}. ` : ""}${choice.text}` };
}

export default async function ExamDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { profile, supabase } = await requireLearner();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, title, description, duration_minutes, status, start_at, end_at, randomize_questions, randomize_choices, show_result_after_submit, show_score_after_submit, allow_review_after_close, max_violations")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!exam) notFound();

  const { data: existingAttempts } = await supabase
    .from("exam_attempts")
    .select("id, score, max_score, submitted_at, started_at, status")
    .eq("exam_id", id)
    .eq("learner_id", profile.id)
    .in("status", ["submitted", "in_progress"])
    .order("created_at", { ascending: false });

  const { data: rows } = await supabase
    .from("exam_question_public")
    .select("order_index, points_override, question_id, question_text, question_type, choices, points")
    .eq("exam_id", id)
    .order("order_index")
    .returns<QuestionRow[]>();

  const { data: retakeGrant } = await supabase
    .from("exam_retake_grants")
    .select("id, note")
    .eq("exam_id", id)
    .eq("learner_id", profile.id)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const canRetake = Boolean(retakeGrant);

  const submitted = existingAttempts?.find((attempt) => attempt.status === "submitted");
  let inProgress = existingAttempts?.find((attempt) => attempt.status === "in_progress");

  if ((!submitted || canRetake) && !inProgress) {
    const { data: createdAttempt } = await supabase
      .from("exam_attempts")
      .insert({
        exam_id: id,
        learner_id: profile.id,
        status: "in_progress",
        score: 0,
        max_score: 0
      })
      .select("id, score, max_score, submitted_at, started_at, status")
      .single();

    inProgress = createdAttempt ?? undefined;

    if (submitted && retakeGrant) {
      await supabase.from("exam_retake_grants").update({ used: true }).eq("id", retakeGrant.id);
    }
  }
  const showResult = exam.show_result_after_submit ?? exam.show_score_after_submit ?? true;
  const closesAt = exam.end_at ? new Date(exam.end_at).getTime() : null;
  // eslint-disable-next-line react-hooks/purity -- server-rendered per request; needs the actual current time to gate review access
  const reviewAllowed = Boolean(exam.allow_review_after_close && closesAt && Date.now() > closesAt);
  const startedAt = inProgress?.started_at ?? new Date().toISOString();
  const deadline = new Date(new Date(startedAt).getTime() + Number(exam.duration_minutes ?? 30) * 60 * 1000);
  const questionRows = shuffleItems(rows ?? [], Boolean(exam.randomize_questions));
  const action = submitExamAction.bind(null, id);

  return (
    <PortalShell profile={profile}>
      <section className="card rounded-[1.75rem] p-7 sm:p-9">
        <Link href="/learner/exams" className="text-sm font-semibold text-teal-700 hover:text-teal-800">Back to exams</Link>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Online Assessment</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{exam.title}</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-600">{exam.description}</p>
        <p className="mt-4 text-sm font-medium text-slate-500">Duration: {exam.duration_minutes ?? 30} minutes / Submit by {deadline.toLocaleString()}</p>

        <FlashMessage message={query.error} variant="warning" className="mt-6" />
        <FlashMessage message={query.message} variant="success" className="mt-6" />

        {submitted && !canRetake ? (
          <div className="mt-9 rounded-[1.5rem] border border-teal-100/80 bg-teal-50/80 p-6 text-teal-950">
            <h2 className="text-xl font-semibold">Already submitted</h2>
            {showResult || reviewAllowed ? <p className="mt-2 font-medium">Score: {submitted.score}/{submitted.max_score}</p> : <p className="mt-2 font-medium">Your result will be released by your teacher.</p>}
            <p className="mt-3 text-sm">Need another attempt? Ask your teacher — they can approve a retake for you.</p>
          </div>
        ) : (
          <>
            {submitted && canRetake ? (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm font-medium text-amber-900">
                Retake approved by your teacher. Your previous score was {submitted.score}/{submitted.max_score}.
                {retakeGrant?.note ? <span className="block mt-1 italic">Note: {retakeGrant.note}</span> : null}
              </div>
            ) : null}
            <ExamTimer deadlineIso={deadline.toISOString()} formId="exam-attempt-form" />
            <ExamIntegrityGuard attemptId={inProgress?.id ?? ""} formId="exam-attempt-form" maxViolations={exam.max_violations ?? 3} />
            <form id="exam-attempt-form" action={action} className="mt-2 grid gap-6">
            {questionRows.map((row, index) => {
              const question = row;
              const points = row.points_override ?? question.points ?? 1;
              const choices = shuffleItems((question.choices ?? []).map(normalizedChoice), Boolean(exam.randomize_choices));

              return (
                <fieldset key={question.question_id} className="rounded-[1.5rem] border border-slate-200/70 bg-white/82 p-6 shadow-sm shadow-slate-200/40">
                  <legend className="px-2 text-sm font-semibold text-slate-500">Question {index + 1} / {points} pt</legend>
                  <p className="mt-2 text-lg font-semibold leading-7 text-slate-950">{question.question_text}</p>

                  {question.question_type === "multiple_choice" || question.question_type === "true_false" ? (
                    <div className="mt-5 grid gap-3">
                      {choices.map((choice) => (
                        <label key={choice.value} className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white/75 p-4 text-sm leading-6 shadow-sm shadow-slate-200/40 hover:border-teal-200 hover:bg-teal-50/80">
                          <input type="radio" name={`q_${question.question_id}`} value={choice.value} required />
                          <span className="font-medium text-slate-700">{choice.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : question.question_type === "essay" ? (
                    <textarea name={`q_${question.question_id}`} rows={5} required className="focus-ring mt-4 w-full rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm" placeholder="Write your answer here." />
                  ) : (
                    <input name={`q_${question.question_id}`} required className="focus-ring mt-4 w-full rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm" placeholder="Type your answer" />
                  )}
                </fieldset>
              );
            })}

            <button className="rounded-2xl bg-slate-950 px-6 py-4 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">
              Submit Exam
            </button>
          </form>
          </>
        )}
      </section>
    </PortalShell>
  );
}
