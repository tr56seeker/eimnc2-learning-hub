import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { PortalShell } from "@/components/PortalShell";
import { ReportPrintHeader } from "@/components/reports/ReportPrintHeader";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { SectionHeader } from "@/components/SectionHeader";
import { formatDateTime } from "@/lib/format";
import { requireTeacher } from "@/lib/auth";
import {
  activityCompletionPercent,
  examScorePercent,
  lessonCompletionPercent,
  loadProgressBaseData,
  missingAssignmentCount
} from "@/lib/reports";
import type { CsvColumn, CsvRow } from "@/lib/csv";

export default async function LearnerProgressReportPage({
  searchParams
}: {
  searchParams: Promise<{ section_id?: string; only?: string }>;
}) {
  const { section_id: sectionId, only } = await searchParams;
  const { profile, supabase } = await requireTeacher();
  const data = await loadProgressBaseData(supabase);

  const sectionNameById = new Map(
    data.sections.map((section) => [section.id, `Grade ${section.grade_level} - ${section.name}`])
  );

  let rows = data.learners
    .filter((learner) => !sectionId || learner.section_id === sectionId)
    .map((learner) => {
      const missing = missingAssignmentCount(data, learner.id);
      const late = data.lateCountByLearner.get(learner.id) ?? 0;
      return {
        id: learner.id,
        fullName: learner.full_name,
        lrn: learner.lrn,
        sectionName: learner.section_id ? sectionNameById.get(learner.section_id) ?? "Unknown section" : "No section",
        lessonPct: lessonCompletionPercent(data, learner.id),
        activityPct: activityCompletionPercent(data, learner.id),
        missing,
        late,
        examPct: examScorePercent(data, learner.id),
        lastActivity: data.lastActivityByLearner.get(learner.id) ?? null
      };
    })
    .sort((left, right) => left.fullName.localeCompare(right.fullName));

  if (only === "missing") rows = rows.filter((row) => row.missing > 0);
  if (only === "late") rows = rows.filter((row) => row.late > 0);

  const columns: CsvColumn[] = [
    { key: "fullName", label: "Learner" },
    { key: "lrn", label: "LRN" },
    { key: "sectionName", label: "Section" },
    { key: "lessonPct", label: "Lesson Completion %" },
    { key: "activityPct", label: "Activity Completion %" },
    { key: "missing", label: "Missing Outputs" },
    { key: "late", label: "Late Submissions" },
    { key: "examPct", label: "Avg. Assessment Score %" },
    { key: "lastActivity", label: "Last Activity" }
  ];
  const csvRows: CsvRow[] = rows.map((row) => ({
    fullName: row.fullName,
    lrn: row.lrn ?? "",
    sectionName: row.sectionName,
    lessonPct: row.lessonPct,
    activityPct: row.activityPct,
    missing: row.missing,
    late: row.late,
    examPct: row.examPct ?? "",
    lastActivity: row.lastActivity ? formatDateTime(row.lastActivity) : "No activity yet"
  }));

  return (
    <PortalShell profile={profile}>
      <ReportPrintHeader
        title="Learner Progress Report"
        scope={sectionId ? sectionNameById.get(sectionId) : "All assigned sections"}
        preparedBy={profile.full_name}
      />

      <SectionHeader
        eyebrow="Report"
        title="Learner Progress"
        description="Per-learner completion, missing requirements, and late submissions."
      />

      <div className="print:hidden mb-7 flex flex-wrap items-center justify-between gap-4">
        <Link href="/teacher/reports" className="text-sm font-semibold text-teal-700 hover:underline dark:text-amber-400">
          ← Back to Reports
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <form className="flex flex-wrap items-center gap-2" method="get">
            <select
              name="section_id"
              defaultValue={sectionId ?? ""}
              className="focus-ring rounded-full border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All sections</option>
              {data.sections.map((section) => (
                <option key={section.id} value={section.id}>
                  Grade {section.grade_level} - {section.name}
                </option>
              ))}
            </select>
            <select name="only" defaultValue={only ?? ""} className="focus-ring rounded-full border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
              <option value="">All learners</option>
              <option value="missing">Missing outputs only</option>
              <option value="late">Late submissions only</option>
            </select>
            <button type="submit" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 active:scale-[0.97]">
              Apply
            </button>
          </form>
          <ReportToolbar filename="learner-progress-report.csv" columns={columns} rows={csvRows} />
        </div>
      </div>

      {!rows.length ? (
        <EmptyState title="No learners match this filter" message="Try a different section or filter." />
      ) : (
        <div className="premium-table overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left">Learner</th>
                <th className="px-5 py-3 text-left">Section</th>
                <th className="px-5 py-3 text-left">Lessons</th>
                <th className="px-5 py-3 text-left">Activities</th>
                <th className="px-5 py-3 text-left">Missing</th>
                <th className="px-5 py-3 text-left">Late</th>
                <th className="px-5 py-3 text-left">Avg. Score</th>
                <th className="px-5 py-3 text-left">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">
                    <Link href={`/teacher/learners/${row.id}`} className="hover:text-teal-700 hover:underline dark:hover:text-amber-400 active:scale-[0.97]">
                      {row.fullName}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{row.sectionName}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{row.lessonPct}%</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{row.activityPct}%</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                    {row.missing > 0 ? <span className="font-semibold text-red-700 dark:text-red-300">{row.missing}</span> : "0"}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                    {row.late > 0 ? <span className="font-semibold text-amber-700 dark:text-amber-300">{row.late}</span> : "0"}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{row.examPct !== null ? `${row.examPct}%` : "No data"}</td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{row.lastActivity ? formatDateTime(row.lastActivity) : "No activity yet"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalShell>
  );
}
