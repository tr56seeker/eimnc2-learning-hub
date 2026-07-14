import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { requireLearner } from "@/lib/auth";
import { publishDueLessons } from "@/lib/lesson-scheduling";
import { firstRelation } from "@/lib/relations";

export default async function LearnerLessonsPage() {
  const { profile, supabase } = await requireLearner();

  await publishDueLessons();

  const [lessonsResult, progressResult] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, title, summary, estimated_minutes, competencies(code, title)")
      .eq("published", true)
      .order("order_index"),
    supabase.from("lesson_progress").select("lesson_id, completed").eq("learner_id", profile.id)
  ]);

  const lessons = lessonsResult.data;
  const completedLessonIds = new Set(
    (progressResult.data ?? []).filter((row) => row.completed).map((row) => row.lesson_id)
  );

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Lessons" title="EIM Competency Lessons" description="Read the lessons before taking exams or submitting performance outputs." />

      {!lessons?.length ? (
        <EmptyState title="No lessons yet" message="Your teacher has not published lessons yet." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => {
            const competency = firstRelation(lesson.competencies);
            const completed = completedLessonIds.has(lesson.id);

            return (
              <Link key={lesson.id} href={`/learner/lessons/${lesson.id}`} className="card rounded-[1.5rem] p-6 hover:-translate-y-0.5 hover:shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                    {competency?.code ?? "EIM"}
                  </p>
                  {completed ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Completed</span>
                  ) : null}
                </div>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{lesson.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{lesson.summary}</p>
                <p className="mt-6 text-sm font-medium text-slate-500">{lesson.estimated_minutes ?? 30} minutes</p>
              </Link>
            );
          })}
        </div>
      )}
    </PortalShell>
  );
}
