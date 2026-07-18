import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { MasteryViewSwitcher } from "@/components/MasteryViewSwitcher";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { firstRelation } from "@/lib/relations";

type AttemptRow = {
  id: string;
  exam_id: string;
  learner_id: string;
  score: number | null;
  max_score: number | null;
  submitted_at: string | null;
  profiles: { full_name: string; section_id: string | null } | { full_name: string; section_id: string | null }[] | null;
  exams: { competency_id: string | null; competencies: { code: string; title: string } | { code: string; title: string }[] | null } | { competency_id: string | null; competencies: { code: string; title: string } | { code: string; title: string }[] | null }[] | null;
};

// A learner can have more than one submitted attempt for the same exam
// after a teacher-approved retake. Only the most recent attempt should
// count toward mastery, matching the same "latest attempt wins" rule
// applied to the learner's own grade in app/learner/exams/actions.ts.
function latestAttemptPerLearnerExam(attempts: AttemptRow[]) {
  const latest = new Map<string, AttemptRow>();
  for (const attempt of attempts) {
    const key = `${attempt.learner_id}:${attempt.exam_id}`;
    const existing = latest.get(key);
    if (!existing || (attempt.submitted_at ?? "") > (existing.submitted_at ?? "")) {
      latest.set(key, attempt);
    }
  }
  return [...latest.values()];
}

function masteryLevel(percentValue: number) {
  if (percentValue >= 80) return { label: "Mastered", color: "text-emerald-700 border-emerald-200 bg-emerald-50", bar: "bg-emerald-500" };
  if (percentValue >= 60) return { label: "Developing", color: "text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-300 dark:border-amber-800/50 dark:bg-amber-950/40", bar: "bg-amber-500" };
  return { label: "Needs Remediation", color: "text-red-700 border-red-200 bg-red-50 dark:text-red-300 dark:border-red-900/50 dark:bg-red-950/30", bar: "bg-red-500" };
}

export default async function MasteryReportPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view: rawView } = await searchParams;
  const view = rawView === "competency" || rawView === "section" ? rawView : "learner";
  const { profile, supabase } = await requireTeacher();

  const [{ data: attempts }, { data: sections }] = await Promise.all([
    supabase
      .from("exam_attempts")
      .select("id, exam_id, learner_id, score, max_score, submitted_at, profiles(full_name, section_id), exams(competency_id, competencies(code, title))")
      .eq("status", "submitted")
      .returns<AttemptRow[]>(),
    supabase.from("sections").select("id, name")
  ]);

  const sectionNameById = new Map((sections ?? []).map((section) => [section.id, section.name]));

  type Bucket = { key: string; label: string; totalScore: number; totalMax: number; learnerIds: Set<string> };
  const buckets = new Map<string, Bucket>();

  for (const attempt of latestAttemptPerLearnerExam(attempts ?? [])) {
    const learner = firstRelation(attempt.profiles);
    const exam = firstRelation(attempt.exams);
    const competency = exam ? firstRelation(exam.competencies) : undefined;

    let key: string;
    let label: string;

    if (view === "learner") {
      key = attempt.learner_id;
      label = learner?.full_name ?? "Unknown learner";
    } else if (view === "competency") {
      key = exam?.competency_id ?? "unassigned";
      label = competency ? `${competency.code} — ${competency.title}` : "No competency tagged";
    } else {
      key = learner?.section_id ?? "unassigned";
      label = learner?.section_id ? (sectionNameById.get(learner.section_id) ?? "Unknown section") : "No section";
    }

    if (!buckets.has(key)) {
      buckets.set(key, { key, label, totalScore: 0, totalMax: 0, learnerIds: new Set() });
    }

    const bucket = buckets.get(key)!;
    bucket.totalScore += Number(attempt.score ?? 0);
    bucket.totalMax += Number(attempt.max_score ?? 0);
    bucket.learnerIds.add(attempt.learner_id);
  }

  const rows = Array.from(buckets.values())
    .map((bucket) => ({
      ...bucket,
      percentValue: bucket.totalMax > 0 ? Math.round((bucket.totalScore / bucket.totalMax) * 100) : 0,
      learnerCount: bucket.learnerIds.size
    }))
    .sort((left, right) => right.percentValue - left.percentValue);

  const viewLabel = view === "learner" ? "learner" : view === "competency" ? "competency" : "section";

  return (
    <PortalShell profile={profile}>
      <SectionHeader
        eyebrow="Mastery Level Report"
        title="Exam Mastery Overview"
        description="Mastery is based on submitted exam scores: 80%+ Mastered, 60-79% Developing, below 60% Needs Remediation."
      />

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <MasteryViewSwitcher current={view} />
        <Link href="/teacher/gradebook" className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800 active:scale-[0.97]">
          Open Gradebook
        </Link>
      </div>

      {!rows.length ? (
        <EmptyState title="No submitted exams yet" message={`Mastery per ${viewLabel} will appear once learners submit exams.`} />
      ) : (
        <div className="grid gap-4">
          {rows.map((row) => {
            const mastery = masteryLevel(row.percentValue);
            return (
              <div key={row.key} className="card rounded-[1.5rem] p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-slate-100">{row.label}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                      {row.learnerCount} learner{row.learnerCount === 1 ? "" : "s"} &middot; {row.totalScore}/{row.totalMax} pts
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${mastery.color}`}>
                    {mastery.label}
                  </span>
                </div>
                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full ${mastery.bar}`} style={{ width: `${row.percentValue}%` }} />
                </div>
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{row.percentValue}% average score</p>
              </div>
            );
          })}
        </div>
      )}
    </PortalShell>
  );
}
