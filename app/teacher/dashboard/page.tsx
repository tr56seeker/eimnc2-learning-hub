import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCard } from "@/components/StatCard";
import { requireTeacher } from "@/lib/auth";

export default async function TeacherDashboardPage() {
  const { profile, supabase } = await requireTeacher();

  const [learners, lessons, exams, pending] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "learner"),
    supabase.from("lessons").select("id", { count: "exact", head: true }),
    supabase.from("exams").select("id", { count: "exact", head: true }),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "submitted")
  ]);

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher Dashboard" title="EIM Class Management" description="Manage lessons, online exams, learner submissions, and class performance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Learners" value={learners.count ?? 0} />
        <StatCard label="Lessons" value={lessons.count ?? 0} />
        <StatCard label="Exams" value={exams.count ?? 0} />
        <StatCard label="Pending Checks" value={pending.count ?? 0} />
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Lesson Manager", "Publish competency-based lessons.", "/teacher/lessons"],
          ["Exam Manager", "Create and publish scheduled exams.", "/teacher/exams"],
          ["Question Bank", "Build reusable objective and essay questions.", "/teacher/question-bank"],
          ["Check Outputs", "Score learner performance tasks.", "/teacher/submissions"],
          ["Gradebook", "Monitor scores and mastery.", "/teacher/gradebook"]
        ].map(([title, text, href]) => (
          <Link key={href} href={href} className="card rounded-[1.75rem] p-6 hover:-translate-y-0.5 hover:shadow-2xl">
            <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            <p className="mt-5 font-bold text-teal-700">Open</p>
          </Link>
        ))}
      </section>
    </PortalShell>
  );
}
