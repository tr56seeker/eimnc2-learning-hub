import Link from "next/link";
import { WelcomeHero } from "@/components/dashboard/WelcomeHero";
import { PortalShell } from "@/components/PortalShell";
import { StatCard } from "@/components/StatCard";
import { requireTeacher } from "@/lib/auth";
import { firstRelation } from "@/lib/relations";
import { formatDateTime } from "@/lib/format";

export default async function TeacherDashboardPage() {
  const { profile, supabase } = await requireTeacher();

  const [learners, activeLearners, sections, learnersWithoutSection, lessons, exams, pending, cheatingAlerts] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "learner"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "learner").eq("status", "active"),
    supabase.from("sections").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "learner").is("section_id", null),
    supabase.from("lessons").select("id", { count: "exact", head: true }),
    supabase.from("exams").select("id", { count: "exact", head: true }),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    supabase
      .from("exam_attempts")
      .select("id, violation_count, termination_reason, submitted_at, learner_id, exam_id, profiles(full_name), exams(title)")
      .not("termination_reason", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(5)
  ]);

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
          <h2 className="text-lg font-semibold text-red-800">⚠️ Academic Integrity Alerts</h2>
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
          <Link href="/teacher/incidents" className="mt-4 inline-block text-sm font-semibold text-red-700 hover:text-red-800">
            Review all flagged incidents
          </Link>
        </section>
      ) : null}

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Learners" value={learners.count ?? 0} />
        <StatCard label="Active Learners" value={activeLearners.count ?? 0} />
        <StatCard label="Sections" value={sections.count ?? 0} />
        <StatCard label="Without Section" value={learnersWithoutSection.count ?? 0} />
        <StatCard label="Lessons" value={lessons.count ?? 0} />
        <StatCard label="Exams" value={exams.count ?? 0} />
        <StatCard label="Pending Checks" value={pending.count ?? 0} />
      </div>

      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Learner Management", "Manage profiles, sections, and learner status.", "/teacher/learners"],
          ["Section Management", "Create sections and monitor enrollment counts.", "/teacher/sections"],
          ["Lesson Manager", "Publish competency-based lessons.", "/teacher/lessons"],
          ["Exam Manager", "Create and publish scheduled exams.", "/teacher/exams"],
          ["Question Bank", "Build reusable objective and essay questions.", "/teacher/question-bank"],
          ["Mastery Report", "View exam mastery by learner, competency, or section.", "/teacher/mastery"],
          ["Check Outputs", "Score learner performance tasks.", "/teacher/submissions"],
          ["Term Gradebook", "Monitor term scores, summaries, and mastery.", "/teacher/gradebook"]
        ].map(([title, text, href]) => (
          <Link key={href} href={href} className="card rounded-[1.5rem] p-6 hover:-translate-y-0.5 hover:shadow-xl">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            <p className="mt-6 text-sm font-semibold text-teal-700">Open</p>
          </Link>
        ))}
      </section>
    </PortalShell>
  );
}
