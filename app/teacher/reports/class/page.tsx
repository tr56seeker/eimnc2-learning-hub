import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { PortalShell } from "@/components/PortalShell";
import { ReportPrintHeader } from "@/components/reports/ReportPrintHeader";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import {
  activityCompletionPercent,
  examScorePercent,
  lessonCompletionPercent,
  loadProgressBaseData,
  missingAssignmentCount
} from "@/lib/reports";
import type { CsvColumn, CsvRow } from "@/lib/csv";

export default async function ClassProgressReportPage() {
  const { profile, supabase } = await requireTeacher();
  const data = await loadProgressBaseData(supabase);

  const rows = data.sections
    .map((section) => {
      const learners = data.learners.filter((learner) => learner.section_id === section.id);
      const learnerCount = learners.length;

      const avgLessonPct = learnerCount
        ? Math.round(learners.reduce((sum, learner) => sum + lessonCompletionPercent(data, learner.id), 0) / learnerCount)
        : 0;
      const avgActivityPct = learnerCount
        ? Math.round(learners.reduce((sum, learner) => sum + activityCompletionPercent(data, learner.id), 0) / learnerCount)
        : 0;
      const missingTotal = learners.reduce((sum, learner) => sum + missingAssignmentCount(data, learner.id), 0);
      const examScores = learners.map((learner) => examScorePercent(data, learner.id)).filter((value): value is number => value !== null);
      const avgExamPct = examScores.length ? Math.round(examScores.reduce((sum, value) => sum + value, 0) / examScores.length) : null;

      return {
        id: section.id,
        name: `Grade ${section.grade_level} - ${section.name}`,
        schoolYear: section.school_year,
        isActive: section.is_active,
        learnerCount,
        avgLessonPct,
        avgActivityPct,
        missingTotal,
        avgExamPct
      };
    })
    .sort((left, right) => right.learnerCount - left.learnerCount);

  const columns: CsvColumn[] = [
    { key: "name", label: "Section" },
    { key: "schoolYear", label: "School Year" },
    { key: "learnerCount", label: "Learners" },
    { key: "avgLessonPct", label: "Avg. Lesson Completion %" },
    { key: "avgActivityPct", label: "Avg. Activity Completion %" },
    { key: "missingTotal", label: "Total Missing Outputs" },
    { key: "avgExamPct", label: "Avg. Assessment Score %" }
  ];
  const csvRows: CsvRow[] = rows.map((row) => ({
    name: row.name,
    schoolYear: row.schoolYear ?? "",
    learnerCount: row.learnerCount,
    avgLessonPct: row.avgLessonPct,
    avgActivityPct: row.avgActivityPct,
    missingTotal: row.missingTotal,
    avgExamPct: row.avgExamPct ?? ""
  }));

  return (
    <PortalShell profile={profile}>
      <ReportPrintHeader title="Class Progress Report" preparedBy={profile.full_name} />

      <SectionHeader
        eyebrow="Report"
        title="Class Progress"
        description="Per-section lesson completion, activity completion, missing outputs, and average assessment scores, scoped to your assigned sections."
      />

      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <Link href="/teacher/reports" className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400">
          ← Back to Reports
        </Link>
        <ReportToolbar filename="class-progress-report.csv" columns={columns} rows={csvRows} />
      </div>

      {!rows.length ? (
        <EmptyState title="No sections yet" message="Create a section to see class progress here." />
      ) : (
        <div className="premium-table overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left">Section</th>
                <th className="px-5 py-3 text-left">Learners</th>
                <th className="px-5 py-3 text-left">Lesson Completion</th>
                <th className="px-5 py-3 text-left">Activity Completion</th>
                <th className="px-5 py-3 text-left">Missing Outputs</th>
                <th className="px-5 py-3 text-left">Avg. Assessment Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => (
                <tr key={row.id} className={row.isActive ? "" : "opacity-60"}>
                  <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">
                    {row.name}
                    {!row.isActive ? <span className="ml-2 text-xs font-medium text-slate-400 dark:text-slate-500">(inactive)</span> : null}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{row.learnerCount}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{row.avgLessonPct}%</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{row.avgActivityPct}%</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{row.missingTotal}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{row.avgExamPct !== null ? `${row.avgExamPct}%` : "No data"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalShell>
  );
}
