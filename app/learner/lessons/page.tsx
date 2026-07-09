import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { requireLearner } from "@/lib/auth";

export default async function LearnerLessonsPage() {
  const { profile, supabase } = await requireLearner();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, summary, estimated_minutes, competencies(code, title)")
    .eq("published", true)
    .order("order_index");

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Lessons" title="EIM Competency Lessons" description="Read the lessons before taking exams or submitting performance outputs." />

      {!lessons?.length ? (
        <EmptyState title="No lessons yet" message="Your teacher has not published lessons yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <Link key={lesson.id} href={`/learner/lessons/${lesson.id}`} className="card rounded-3xl p-6 hover:-translate-y-1 hover:shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">
                {lesson.competencies?.code ?? "EIM"}
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-950">{lesson.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{lesson.summary}</p>
              <p className="mt-5 text-sm font-bold text-slate-500">{lesson.estimated_minutes ?? 30} minutes</p>
            </Link>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
