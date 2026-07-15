import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";

const reportLinks = [
  ["Class Progress", "Per-section completion, missing outputs, and average assessment performance.", "/teacher/reports/class"],
  ["Learner Progress", "Per-learner completion, missing requirements, and late submissions.", "/teacher/reports/learners"],
  ["Assessment Item Analysis", "Per-question correct rate and frequency of error for a chosen exam.", "/teacher/reports/assessments"],
  ["Intervention Report", "Learners flagged for low completion, low scores, or open integrity incidents.", "/teacher/reports/interventions"],
  ["Mastery Overview", "Existing exam mastery report by learner, competency, or section.", "/teacher/mastery"]
];

export default async function ReportsHubPage() {
  const { profile } = await requireTeacher();

  return (
    <PortalShell profile={profile}>
      <SectionHeader
        eyebrow="Reports"
        title="Reporting"
        description="Filterable, exportable reports covering class progress, learner requirements, assessment results, and intervention needs."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {reportLinks.map(([title, text, href]) => (
          <Link key={href} href={href} className="card rounded-[1.5rem] p-6 hover:-translate-y-0.5 hover:shadow-xl">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            <p className="mt-6 text-sm font-semibold text-teal-700">Open report</p>
          </Link>
        ))}
      </div>

      {profile.role === "admin" ? (
        <div className="mt-10">
          <Link
            href="/teacher/admin/audit-logs"
            className="inline-block rounded-2xl border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            Open Audit Log →
          </Link>
        </div>
      ) : null}
    </PortalShell>
  );
}
