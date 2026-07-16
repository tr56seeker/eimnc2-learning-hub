import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { FlashMessage } from "@/components/FlashMessage";
import { requireLearner } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { firstRelation } from "@/lib/relations";

export default async function LearnerExamsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string; violation?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireLearner();

  const { data: exams } = await supabase
    .from("exams")
    .select("id, title, description, duration_minutes, start_at, end_at, competencies(code, title)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Exams" title="Available Exams" description="Answer only when ready. Each learner is allowed one submitted attempt per exam unless your teacher grants a retake." />

      {params.violation === "1" ? (
        <div role="alert" className="mb-7 status-danger rounded-2xl border p-5">
          <p className="font-semibold">Your exam has been terminated due to the following reason:</p>
          <p className="mt-1.5 text-sm leading-6">{params.message}</p>
        </div>
      ) : (
        <>
          <FlashMessage message={params.error} variant="error" className="mb-7" />
          <FlashMessage message={params.message} variant="success" className="mb-7" />
        </>
      )}

      {!exams?.length ? (
        <EmptyState title="No exam available" message="Your teacher has not published exams yet." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {exams.map((exam) => {
            const competency = firstRelation(exam.competencies);

            return (
              <Link key={exam.id} href={`/learner/exams/${exam.id}`} className="card rounded-[1.5rem] p-6 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-amber-400">
                  {competency?.code ?? "EIM"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{exam.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{exam.description}</p>
                <div className="mt-6 grid gap-2.5 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  <p><strong>Duration:</strong> {exam.duration_minutes ?? 30} minutes</p>
                  <p><strong>Opens:</strong> {formatDateTime(exam.start_at)}</p>
                  <p><strong>Closes:</strong> {formatDateTime(exam.end_at)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PortalShell>
  );
}
