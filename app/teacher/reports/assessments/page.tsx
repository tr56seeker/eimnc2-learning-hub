import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { PortalShell } from "@/components/PortalShell";
import { ReportPrintHeader } from "@/components/reports/ReportPrintHeader";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { loadExamOptions, loadItemAnalysis } from "@/lib/reports";
import type { CsvColumn, CsvRow } from "@/lib/csv";

export default async function AssessmentItemAnalysisPage({ searchParams }: { searchParams: Promise<{ exam_id?: string }> }) {
  const { exam_id: examId } = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const exams = await loadExamOptions(supabase);
  const selectedExam = examId ? exams.find((exam) => exam.id === examId) : undefined;
  const rows = examId ? await loadItemAnalysis(supabase, examId) : [];

  const columns: CsvColumn[] = [
    { key: "questionText", label: "Question" },
    { key: "attempts", label: "Attempts" },
    { key: "correctCount", label: "Correct" },
    { key: "correctPct", label: "Correct %" },
    { key: "avgScorePct", label: "Avg. Score %" }
  ];
  const csvRows: CsvRow[] = rows.map((row) => ({
    questionText: row.questionText,
    attempts: row.attempts,
    correctCount: row.correctCount,
    correctPct: row.correctPct,
    avgScorePct: row.avgScorePct
  }));

  return (
    <PortalShell profile={profile}>
      <ReportPrintHeader
        title="Assessment Item Analysis"
        scope={selectedExam?.title ?? "No exam selected"}
        preparedBy={profile.full_name}
      />

      <SectionHeader
        eyebrow="Report"
        title="Assessment Item Analysis"
        description="Per-question correct rate and average score, based on each learner's latest submitted attempt. Lower correct rates indicate frequently-missed items worth revisiting."
      />

      <div className="print:hidden mb-7 flex flex-wrap items-center justify-between gap-4">
        <Link href="/teacher/reports" className="text-sm font-semibold text-teal-700 hover:underline">
          ← Back to Reports
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <form className="flex items-center gap-2" method="get">
            <select name="exam_id" defaultValue={examId ?? ""} className="focus-ring rounded-full border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">Choose an exam…</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.status})
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
              View
            </button>
          </form>
          {rows.length ? <ReportToolbar filename="assessment-item-analysis.csv" columns={columns} rows={csvRows} /> : null}
        </div>
      </div>

      {!examId ? (
        <EmptyState title="Choose an exam" message="Select an exam above to view its per-question item analysis." />
      ) : !rows.length ? (
        <EmptyState title="No submitted attempts yet" message="Item analysis will appear once learners submit this exam." />
      ) : (
        <div className="premium-table overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Question</th>
                <th className="px-5 py-3 text-left">Attempts</th>
                <th className="px-5 py-3 text-left">Correct</th>
                <th className="px-5 py-3 text-left">Correct %</th>
                <th className="px-5 py-3 text-left">Avg. Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.questionId}>
                  <td className="px-5 py-4 font-medium text-slate-900">{row.questionText}</td>
                  <td className="px-5 py-4 text-slate-600">{row.attempts}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {row.correctCount}/{row.gradedAttempts || row.attempts}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.correctPct < 50 ? "bg-red-50 text-red-700" : row.correctPct < 75 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {row.correctPct}%
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{row.avgScorePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalShell>
  );
}
