import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { requireLearner } from "@/lib/auth";
import { submitExamAction } from "../actions";

type QuestionRow = {
  order_index: number;
  points_override: number | null;
  question_id: string;
  question_text: string;
  question_type: string;
  choices: { label: string; value: string }[] | null;
  points: number | null;
};

function shuffleItems<T>(items: T[], enabled: boolean) {
  if (!enabled) return items;
  return [...items].sort(() => Math.random() - 0.5);
}

export default async function ExamDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { profile, supabase } = await requireLearner();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, title, description, duration_minutes, status, start_at, end_at, randomize_questions, randomize_choices, show_result_after_submit, show_score_after_submit, allow_review_after_close")
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

  const submitted = existingAttempts?.find((attempt) => attempt.status === "submitted");
  let inProgress = existingAttempts?.find((attempt) => attempt.status === "in_progress");

  if (!submitted && !inProgress) {
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
  }
  const showResult = exam.show_result_after_submit ?? exam.show_score_after_submit ?? true;
  const closesAt = exam.end_at ? new Date(exam.end_at).getTime() : null;
  const reviewAllowed = Boolean(exam.allow_review_after_close && closesAt && Date.now() > closesAt);
  const startedAt = inProgress?.started_at ?? new Date().toISOString();
  const deadline = new Date(new Date(startedAt).getTime() + Number(exam.duration_minutes ?? 30) * 60 * 1000);
  const questionRows = shuffleItems(rows ?? [], Boolean(exam.randomize_questions));
  const action = submitExamAction.bind(null, id);

  return (
    <PortalShell profile={profile}>
      <section className="card rounded-[2rem] p-6 sm:p-8">
        <Link href="/learner/exams" className="text-sm font-bold text-teal-700 hover:text-teal-800">Back to exams</Link>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-teal-700">Online Assessment</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-5xl">{exam.title}</h1>
        <p className="mt-3 max-w-3xl text-slate-600">{exam.description}</p>
        <p className="mt-3 text-sm font-bold text-slate-500">Duration: {exam.duration_minutes ?? 30} minutes · Submit by {deadline.toLocaleString()}</p>

        {query.message ? <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 font-bold text-yellow-800">{query.message}</div> : null}

        {submitted ? (
          <div className="mt-8 rounded-[1.75rem] border border-teal-100/80 bg-teal-50/80 p-6 text-teal-950">
            <h2 className="text-xl font-black">Already submitted</h2>
            {showResult || reviewAllowed ? <p className="mt-2 font-bold">Score: {submitted.score}/{submitted.max_score}</p> : <p className="mt-2 font-bold">Your result will be released by your teacher.</p>}
          </div>
        ) : (
          <form action={action} className="mt-8 grid gap-5">
            {questionRows.map((row, index) => {
              const question = row;
              const points = row.points_override ?? question.points ?? 1;
              const choices = shuffleItems(question.choices ?? [], Boolean(exam.randomize_choices));

              return (
                <fieldset key={question.question_id} className="rounded-[1.75rem] border border-white/70 bg-white/74 p-5 shadow-sm">
                  <legend className="px-2 text-sm font-black text-slate-500">Question {index + 1} · {points} pt</legend>
                  <p className="mt-2 text-lg font-black text-slate-950">{question.question_text}</p>

                  {question.question_type === "multiple_choice" || question.question_type === "true_false" ? (
                    <div className="mt-4 grid gap-3">
                      {choices.map((choice) => (
                        <label key={choice.value} className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm hover:border-teal-200 hover:bg-teal-50/80">
                          <input type="radio" name={`q_${question.question_id}`} value={choice.value} required />
                          <span className="font-semibold text-slate-700">{choice.label}</span>
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

            <button className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">
              Submit Exam
            </button>
          </form>
        )}
      </section>
    </PortalShell>
  );
}
