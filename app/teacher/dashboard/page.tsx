import Link from "next/link";
import { WelcomeHero } from "@/components/dashboard/WelcomeHero";
import { AttentionCard, type AttentionRow } from "@/components/dashboard/AttentionCard";
import { MiniListCard, type MiniListItem } from "@/components/dashboard/MiniListCard";
import { QuickLinkGrid, type QuickLink } from "@/components/dashboard/QuickLinkGrid";
import { PortalShell } from "@/components/PortalShell";
import { StatCard } from "@/components/StatCard";
import { requireTeacher } from "@/lib/auth";
import { firstRelation } from "@/lib/relations";
import { formatDateTime } from "@/lib/format";
import { classifyLearnerRisk, loadProgressBaseData } from "@/lib/reports";

const SHORTCUTS: QuickLink[] = [
  { label: "Lessons", href: "/teacher/lessons", glyph: "Le", tone: "teal" },
  { label: "Competencies", href: "/teacher/competencies", glyph: "Co", tone: "indigo" },
  { label: "Activities", href: "/teacher/activities", glyph: "Ac", tone: "indigo" },
  { label: "Exams", href: "/teacher/exams", glyph: "Ex", tone: "violet" },
  { label: "Question Bank", href: "/teacher/question-bank", glyph: "QB", tone: "indigo" },
  { label: "Gradebook", href: "/teacher/gradebook", glyph: "Gb", tone: "amber" },
  { label: "Sections", href: "/teacher/sections", glyph: "Se", tone: "slate" },
  { label: "Projects", href: "/teacher/projects", glyph: "Pr", tone: "teal" },
  { label: "Achievements", href: "/teacher/achievements", glyph: "Aw", tone: "amber" },
  { label: "Incidents", href: "/teacher/incidents", glyph: "In", tone: "rose" },
  { label: "Reports", href: "/teacher/reports", glyph: "Rp", tone: "violet" }
];

const ADMIN_SHORTCUTS: QuickLink[] = [
  { label: "Staff Accounts", href: "/teacher/admin/teachers", glyph: "St", tone: "slate" },
  { label: "Academic Years", href: "/teacher/admin/academic-years", glyph: "AY", tone: "slate" },
  { label: "Audit Log", href: "/teacher/admin/audit-logs", glyph: "Au", tone: "slate" }
];

export default async function TeacherDashboardPage() {
  const { profile, supabase } = await requireTeacher();

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = now.toISOString();

  const [activeLearners, sections, learnersWithoutSection, lessons, pending, cheatingAlerts, progressData, dueAssignments, dueExams, recentLessons] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "learner").eq("status", "active"),
    supabase.from("sections").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "learner").is("section_id", null),
    supabase.from("lessons").select("id", { count: "exact", head: true }).eq("published", true),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    supabase
      .from("exam_attempts")
      .select("id, violation_count, termination_reason, submitted_at, learner_id, exam_id, profiles(full_name), exams(title)")
      .not("termination_reason", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(5),
    loadProgressBaseData(supabase),
    supabase.from("assignments").select("id, title, due_at").eq("is_active", true).gte("due_at", nowIso).lte("due_at", weekFromNow).order("due_at", { ascending: true }).limit(4),
    supabase.from("exams").select("id, title, start_at").eq("status", "published").gte("start_at", nowIso).lte("start_at", weekFromNow).order("start_at", { ascending: true }).limit(4),
    supabase.from("lessons").select("id, title, created_at").eq("published", true).order("created_at", { ascending: false }).limit(3)
  ]);

  const flaggedLearnerCount = progressData.learners.filter((learner) => classifyLearnerRisk(progressData, learner.id).riskLevel !== "Normal").length;

  const attentionRows: AttentionRow[] = [
    { label: "Submissions to check", value: pending.count ?? 0, href: "/teacher/submissions", tone: "amber" },
    { label: "Learners flagged for follow-up", value: flaggedLearnerCount, href: "/teacher/reports/interventions", tone: "rose" },
    { label: "Learners without a section", value: learnersWithoutSection.count ?? 0, href: "/teacher/learners", tone: "slate" }
  ];

  const dueThisWeek: MiniListItem[] = [
    ...(dueAssignments.data ?? []).map((assignment) => ({
      id: `assignment-${assignment.id}`,
      primary: assignment.title,
      secondary: `Activity due ${formatDateTime(assignment.due_at)}`,
      href: "/teacher/activities"
    })),
    ...(dueExams.data ?? []).map((exam) => ({
      id: `exam-${exam.id}`,
      primary: exam.title,
      secondary: `Exam opens ${formatDateTime(exam.start_at)}`,
      href: "/teacher/exams"
    }))
  ]
    .sort((left, right) => left.secondary.localeCompare(right.secondary))
    .slice(0, 4);

  const recentlyPublished: MiniListItem[] = (recentLessons.data ?? []).map((lesson) => ({
    id: lesson.id,
    primary: lesson.title,
    secondary: `Published ${formatDateTime(lesson.created_at)}`,
    href: "/teacher/lessons"
  }));

  return (
    <PortalShell profile={profile}>
      <WelcomeHero
        fullName={profile.full_name}
        role={profile.role === "admin" ? "admin" : "teacher"}
        subtitle="Manage your lessons, exams, submissions, and learner progress from one clean workspace."
        primaryAction={{ href: "/teacher/lessons", label: "Open Lesson Studio" }}
        secondaryAction={{ href: "/teacher/submissions", label: "Check Submissions" }}
      />

      {cheatingAlerts.data && cheatingAlerts.data.length > 0 ? (
        <section className="mt-8 rounded-[1.5rem] border border-red-200 bg-red-50/80 p-6">
          <h2 className="text-lg font-semibold text-red-800">Academic Integrity Alerts</h2>
          <p className="mt-1 text-sm text-red-700">Exams auto-submitted due to policy violations (tab-switching, copy/paste, etc.).</p>
          <div className="mt-4 grid gap-3">
            {cheatingAlerts.data.map((alert) => {
              const learner = firstRelation(alert.profiles);
              const exam = firstRelation(alert.exams);
              return (
                <Link
                  key={alert.id}
                  href={`/teacher/learners/${alert.learner_id}`}
                  className="block rounded-2xl border border-red-200/80 bg-white/80 p-4 hover:border-red-300 hover:bg-white"
                >
                  <p className="font-semibold text-slate-950">{learner?.full_name ?? "Learner"} — {exam?.title ?? "Exam"}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-red-600">{alert.violation_count ?? 0} violations · {formatDateTime(alert.submitted_at)}</p>
                </Link>
              );
            })}
          </div>
          <Link href="/teacher/incidents" className="mt-4 inline-block text-sm font-semibold text-red-700 hover:text-red-800 active:scale-[0.97]">
            Review all flagged incidents
          </Link>
        </section>
      ) : null}

      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        <AttentionCard title="Needs Your Attention" rows={attentionRows} />
        <MiniListCard title="Due This Week" items={dueThisWeek} emptyMessage="Nothing due in the next 7 days." />
        <MiniListCard title="Recently Published" items={recentlyPublished} emptyMessage="No published lessons yet." />
      </section>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <StatCard label="Active Learners" value={activeLearners.count ?? 0} />
        <StatCard label="Sections" value={sections.count ?? 0} />
        <StatCard label="Published Lessons" value={lessons.count ?? 0} />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Shortcuts</h2>
        <QuickLinkGrid links={profile.role === "admin" ? [...SHORTCUTS, ...ADMIN_SHORTCUTS] : SHORTCUTS} />
      </section>
    </PortalShell>
  );
}
