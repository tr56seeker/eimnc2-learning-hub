import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { requireLearner } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export default async function LearnerExamsPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireLearner();

  const { data: exams } = await supabase
    .from("exams")
    .select("id, title, description, duration_minutes, start_at, end_at, competencies(code, title)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Exams" title="Available Exams" description="Answer only when ready. For the MVP version, each learner is allowed one submitted attempt per exam." />

      {params.message ? <div className="mb-5 rounded-2xl border border-teal-200 bg-teal-50 p-4 font-bold text-teal-800">{params.message}</div> : null}

      {!exams?.length ? (
        <EmptyState title="No exam available" message="Your teacher has not published exams yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {exams.map((exam) => (
            <Link key={exam.id} href={`/learner/exams/${exam.id}`} className="card rounded-3xl p-6 hover:-translate-y-1 hover:shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">{exam.competencies?.code ?? "EIM"}</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{exam.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{exam.description}</p>
              <div className="mt-5 grid gap-2 text-sm text-slate-500">
                <p><strong>Duration:</strong> {exam.duration_minutes ?? 30} minutes</p>
                <p><strong>Opens:</strong> {formatDateTime(exam.start_at)}</p>
                <p><strong>Closes:</strong> {formatDateTime(exam.end_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
