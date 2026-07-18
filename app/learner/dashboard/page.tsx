import Link from "next/link";
import { WelcomeHero } from "@/components/dashboard/WelcomeHero";
import { PortalShell } from "@/components/PortalShell";
import { StatCard } from "@/components/StatCard";
import { requireLearner } from "@/lib/auth";

export default async function LearnerDashboardPage() {
  const { profile, supabase } = await requireLearner();

  const [lessons, exams, submissions, grades] = await Promise.all([
    supabase.from("lessons").select("id", { count: "exact", head: true }).eq("published", true),
    supabase.from("exams").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("learner_id", profile.id),
    supabase.from("grades").select("score, max_score").eq("learner_id", profile.id)
  ]);
  const { data: section } = profile.section_id
    ? await supabase.from("sections").select("name, grade_level, school_year").eq("id", profile.section_id).single()
    : { data: null };

  const gradeRows = grades.data ?? [];
  const totalScore = gradeRows.reduce((sum, row) => sum + Number(row.score ?? 0), 0);
  const totalMax = gradeRows.reduce((sum, row) => sum + Number(row.max_score ?? 0), 0);
  const average = totalMax ? Math.round((totalScore / totalMax) * 100) : 0;

  return (
    <PortalShell profile={profile}>
      <WelcomeHero
        fullName={profile.full_name}
        role="learner"
        subtitle="Make every minute count as you build your skills in Electrical Installation and Maintenance."
        primaryAction={{ href: "/learner/lessons", label: "Continue Lessons" }}
        secondaryAction={{ href: "/learner/exams", label: "View Exams" }}
      />

      <section className="card my-10 rounded-[1.5rem] p-6 sm:p-7">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:items-end">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Learner profile</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{profile.full_name}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">Electrical Installation and Maintenance NC II</p>
          </div>
          <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-2 md:text-right">
            <p><span className="font-medium text-slate-900 dark:text-slate-100">Section:</span> {section ? `Grade ${section.grade_level} - ${section.name}` : "Not assigned"}</p>
            <p><span className="font-medium text-slate-900 dark:text-slate-100">Grade:</span> {profile.grade_level ?? section?.grade_level ?? "Not set"}</p>
            <p><span className="font-medium text-slate-900 dark:text-slate-100">Status:</span> {profile.status ?? "active"}</p>
            <p><span className="font-medium text-slate-900 dark:text-slate-100">Track:</span> EIM NC II</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Published Lessons" value={lessons.count ?? 0} />
        <StatCard label="Available Exams" value={exams.count ?? 0} />
        <StatCard label="My Submissions" value={submissions.count ?? 0} />
        <StatCard label="Current Average" value={`${average}%`} helper="Based on encoded scores" />
      </div>

      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        {[
          ["Continue Lessons", "Read competency-based EIM topics.", "/learner/lessons"],
          ["Take Exam", "Answer available quizzes and summative exams.", "/learner/exams"],
          ["Submit Output", "Paste your output, photo, PDF, or video link.", "/learner/submissions"]
        ].map(([title, text, href]) => (
          <Link key={href} href={href} className="card rounded-[1.5rem] p-6 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:shadow-xl">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{title}</h2>
            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{text}</p>
            <p className="mt-6 text-sm font-semibold text-teal-700 dark:text-amber-400">Open</p>
          </Link>
        ))}
      </section>
    </PortalShell>
  );
}
