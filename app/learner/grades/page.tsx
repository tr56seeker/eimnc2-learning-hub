import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { requireLearner } from "@/lib/auth";
import { percent } from "@/lib/format";

export default async function LearnerGradesPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireLearner();

  const { data: grades } = await supabase
    .from("grades")
    .select("id, title, component, score, max_score, created_at")
    .eq("learner_id", profile.id)
    .order("created_at", { ascending: false });

  const rows = grades ?? [];
  const totalScore = rows.reduce((sum, row) => sum + Number(row.score ?? 0), 0);
  const totalMax = rows.reduce((sum, row) => sum + Number(row.max_score ?? 0), 0);

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Grades" title="My Grade Dashboard" description="This dashboard shows encoded scores from exams and checked outputs." />

      {params.message ? <div className="mb-7 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 font-semibold text-teal-800">{params.message}</div> : null}

      <div className="card mb-8 rounded-[1.5rem] p-6 sm:p-7">
        <p className="text-sm font-medium text-slate-500">Overall mastery estimate</p>
        <p className="mt-3 text-5xl font-semibold tracking-tight text-slate-950">{percent(totalScore, totalMax)}%</p>
        <p className="mt-3 text-sm text-slate-500">Raw total: {totalScore}/{totalMax}</p>
      </div>

      {!rows.length ? (
        <EmptyState title="No grades yet" message="Scores will appear after exams or checked outputs." />
      ) : (
        <div className="premium-table overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50/80 text-xs tracking-wider text-slate-500">
              <tr>
                <th className="p-4">Activity</th>
                <th className="p-4">Component</th>
                <th className="p-4">Score</th>
                <th className="p-4">Mastery</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((grade) => (
                <tr key={grade.id} className="border-t border-slate-100">
                  <td className="p-4 font-semibold text-slate-900">{grade.title}</td>
                  <td className="p-4 capitalize text-slate-600">{grade.component.replaceAll("_", " ")}</td>
                  <td className="p-4 font-medium">{grade.score}/{grade.max_score}</td>
                  <td className="p-4 font-semibold text-teal-700">{percent(Number(grade.score), Number(grade.max_score))}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalShell>
  );
}
