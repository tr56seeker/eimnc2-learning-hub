import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { PortalShell } from "@/components/PortalShell";
import { ReportPrintHeader } from "@/components/reports/ReportPrintHeader";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { classifyLearnerRisk, loadProgressBaseData } from "@/lib/reports";
import type { CsvColumn, CsvRow } from "@/lib/csv";

const RISK_STYLES = {
  "High Attention": "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50",
  "Needs Review": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50"
} as const;

export default async function InterventionReportPage() {
  const { profile, supabase } = await requireTeacher();
  const data = await loadProgressBaseData(supabase);

  const sectionNameById = new Map(
    data.sections.map((section) => [section.id, `Grade ${section.grade_level} - ${section.name}`])
  );

  const rows = data.learners
    .map((learner) => {
      const risk = classifyLearnerRisk(data, learner.id);
      return {
        id: learner.id,
        fullName: learner.full_name,
        sectionName: learner.section_id ? sectionNameById.get(learner.section_id) ?? "Unknown section" : "No section",
        ...risk
      };
    })
    .filter((row) => row.riskLevel !== "Normal")
    .sort((left, right) => right.reasons.length - left.reasons.length);

  const columns: CsvColumn[] = [
    { key: "fullName", label: "Learner" },
    { key: "sectionName", label: "Section" },
    { key: "riskLevel", label: "Risk Level" },
    { key: "reasons", label: "Reasons" },
    { key: "completionPct", label: "Overall Completion %" },
    { key: "examPct", label: "Avg. Assessment Score %" }
  ];
  const csvRows: CsvRow[] = rows.map((row) => ({
    fullName: row.fullName,
    sectionName: row.sectionName,
    riskLevel: row.riskLevel,
    reasons: row.reasons.join("; "),
    completionPct: row.completionPct,
    examPct: row.examPct ?? ""
  }));

  return (
    <PortalShell profile={profile}>
      <ReportPrintHeader title="Intervention Report" preparedBy={profile.full_name} />

      <SectionHeader
        eyebrow="Report"
        title="Intervention Report"
        description="Learners flagged for low completion, multiple missing outputs, low assessment scores, or open integrity incidents. These signals are indicators for teacher follow-up, not conclusions."
      />

      <div className="print:hidden mb-7 flex flex-wrap items-center justify-between gap-4">
        <Link href="/teacher/reports" className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400">
          ← Back to Reports
        </Link>
        {rows.length ? <ReportToolbar filename="intervention-report.csv" columns={columns} rows={csvRows} /> : null}
      </div>

      {!rows.length ? (
        <EmptyState title="No learners currently flagged" message="Everyone is on track based on completion, scores, and integrity signals." />
      ) : (
        <div className="grid gap-4">
          {rows.map((row) => (
            <div key={row.id} className="card rounded-[1.5rem] p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/teacher/learners/${row.id}`} className="font-semibold text-slate-950 hover:text-teal-700 hover:underline dark:text-slate-100 dark:hover:text-teal-400">
                    {row.fullName}
                  </Link>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">{row.sectionName}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${RISK_STYLES[row.riskLevel as keyof typeof RISK_STYLES]}`}>
                  {row.riskLevel}
                </span>
              </div>
              <ul className="mt-4 grid gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                {row.reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
