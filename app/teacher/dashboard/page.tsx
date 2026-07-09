import Link from "next/link";
import { WelcomeHero } from "@/components/dashboard/WelcomeHero";
import { PortalShell } from "@/components/PortalShell";
import { StatCard } from "@/components/StatCard";
import { requireTeacher } from "@/lib/auth";

export default async function TeacherDashboardPage() {
  const { profile, supabase } = await requireTeacher();

  const [learners, activeLearners, sections, learnersWithoutSection, lessons, exams, pending] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "learner"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "learner").eq("status", "active"),
    supabase.from("sections").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "learner").is("section_id", null),
    supabase.from("lessons").select("id", { count: "exact", head: true }),
    supabase.from("exams").select("id", { count: "exact", head: true }),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "submitted")
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
