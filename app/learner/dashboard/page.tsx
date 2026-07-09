import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
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

  const gradeRows = grades.data ?? [];
  const totalScore = gradeRows.reduce((sum, row) => sum + Number(row.score ?? 0), 0);
  const totalMax = gradeRows.reduce((sum, row) => sum + Number(row.max_score ?? 0), 0);
  const average = totalMax ? Math.round((totalScore / totalMax) * 100) : 0;

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Learner Dashboard" title={`Welcome, ${profile.full_name}`} description="Track your lessons, exams, outputs, and current learning performance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Published Lessons" value={lessons.count ?? 0} />
        <StatCard label="Available Exams" value={exams.count ?? 0} />
        <StatCard label="My Submissions" value={submissions.count ?? 0} />
        <StatCard label="Current Average" value={`${average}%`} helper="Based on encoded scores" />
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        {[
          ["Continue Lessons", "Read competency-based EIM topics.", "/learner/lessons"],
          ["Take Exam", "Answer available quizzes and summative exams.", "/learner/exams"],
          ["Submit Output", "Paste your output, photo, PDF, or video link.", "/learner/submissions"]
        ].map(([title, text, href]) => (
          <Link key={href} href={href} className="card rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-2xl">
            <h2 className="text-xl font-black text-slate-950">{title}</h2>
            <p className="mt-2 text-slate-600">{text}</p>
            <p className="mt-5 font-bold text-teal-700">Open →</p>
          </Link>
        ))}
      </section>
    </PortalShell>
  );
}
