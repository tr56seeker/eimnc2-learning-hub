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

export default async function ExamDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { profile, supabase } = await requireLearner();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, title, description, duration_minutes, status")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!exam) notFound();

  const { data: existingAttempts } = await supabase
    .from("exam_attempts")
    .select("id, score, max_score, submitted_at")
    .eq("exam_id", id)
    .eq("learner_id", profile.id)
    .eq("status", "submitted");

  const { data: rows } = await supabase
    .from("exam_question_public")
    .select("order_index, points_override, question_id, question_text, question_type, choices, points")
    .eq("exam_id", id)
    .order("order_index")
    .returns<QuestionRow[]>();

  const submitted = existingAttempts?.[0];
  const action = submitExamAction.bind(null, id);

  return (
    <PortalShell profile={profile}>
      <section className="card rounded-[2rem] p-6 sm:p-8">
        <Link href="/learner/exams" className="text-sm font-bold text-teal-700">← Back to exams</Link>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-teal-700">Online Assessment</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-5xl">{exam.title}</h1>
        <p className="mt-3 max-w-3xl text-slate-600">{exam.description}</p>
        <p className="mt-3 text-sm font-bold text-slate-500">Duration guide: {exam.duration_minutes ?? 30} minutes</p>

        {query.message ? <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 font-bold text-yellow-800">{query.message}</div> : null}

        {submitted ? (
          <div className="mt-8 rounded-3xl bg-teal-50 p-6 text-teal-950 ring-1 ring-teal-100">
            <h2 className="text-xl font-black">Already submitted</h2>
            <p className="mt-2 font-bold">Score: {submitted.score}/{submitted.max_score}</p>
          </div>
        ) : (
          <form action={action} className="mt-8 grid gap-5">
            {(rows ?? []).map((row, index) => {
              const question = row;
              const points = row.points_override ?? question.points ?? 1;

              return (
                <fieldset key={question.question_id} className="rounded-3xl border border-slate-200 bg-white p-5">
                  <legend className="px-2 text-sm font-black text-slate-500">Question {index + 1} · {points} pt</legend>
                  <p className="mt-2 text-lg font-black text-slate-950">{question.question_text}</p>

                  {question.question_type === "multiple_choice" || question.question_type === "true_false" ? (
                    <div className="mt-4 grid gap-3">
                      {(question.choices ?? []).map((choice) => (
                        <label key={choice.value} className="flex gap-3 rounded-2xl border border-slate-200 p-4 hover:border-teal-300 hover:bg-teal-50">
                          <input type="radio" name={`q_${question.question_id}`} value={choice.value} required />
                          <span className="font-semibold text-slate-700">{choice.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : question.question_type === "essay" ? (
                    <textarea name={`q_${question.question_id}`} rows={5} required className="focus-ring mt-4 w-full rounded-2xl border border-slate-200 p-4" placeholder="Write your answer here." />
                  ) : (
                    <input name={`q_${question.question_id}`} required className="focus-ring mt-4 w-full rounded-2xl border border-slate-200 p-4" placeholder="Type your answer" />
                  )}
                </fieldset>
              );
            })}

            <button className="rounded-2xl bg-teal-700 px-6 py-4 font-black text-white hover:bg-teal-800">
              Submit Exam
            </button>
          </form>
        )}
      </section>
    </PortalShell>
  );
}
