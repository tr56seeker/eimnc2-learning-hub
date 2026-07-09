import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { requireLearner } from "@/lib/auth";
import { firstRelation } from "@/lib/relations";

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
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => {
            const competency = firstRelation(lesson.competencies);

            return (
              <Link key={lesson.id} href={`/learner/lessons/${lesson.id}`} className="card rounded-[1.5rem] p-6 hover:-translate-y-0.5 hover:shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                  {competency?.code ?? "EIM"}
                </p>
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
