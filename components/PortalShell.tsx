import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { PortalNav } from "@/components/PortalNav";
import { PresenceHeartbeat } from "@/components/presence/PresenceHeartbeat";
import type { Profile } from "@/lib/types";

const learnerLinks = [
  ["Dashboard", "/learner/dashboard"],
  ["Lessons", "/learner/lessons"],
  ["Exams", "/learner/exams"],
  ["Submissions", "/learner/submissions"],
  ["Projects", "/learner/projects"],
  ["Grades", "/learner/grades"],
  ["Achievements", "/learner/achievements"]
];

const teacherLinks = [
  ["Dashboard", "/teacher/dashboard"],
  ["Learners", "/teacher/learners"],
  ["Sections", "/teacher/sections"],
  ["Lessons", "/teacher/lessons"],
  ["Activities", "/teacher/activities"],
  ["Projects", "/teacher/projects"],
  ["Exams", "/teacher/exams"],
  ["Question Bank", "/teacher/question-bank"],
  ["Submissions", "/teacher/submissions"],
  ["Gradebook", "/teacher/gradebook"],
  ["Incidents", "/teacher/incidents"],
  ["Achievements", "/teacher/achievements"]
];

export function PortalShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const links = profile.role === "learner" ? learnerLinks : teacherLinks;
  const portalLabel = profile.role === "learner" ? "Learner Portal" : "Teacher Portal";

  return (
    <div className="min-h-screen">
      <PresenceHeartbeat />
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/88 shadow-sm shadow-slate-200/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="min-w-0">
            <Link href="/portal" className="text-lg font-semibold tracking-tight text-slate-950">
              EIM NC II Learning Hub
            </Link>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{portalLabel}</p>
          </div>
          <PortalNav links={links} />
          <form action={signOutAction}>
            <button className="rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-10 sm:py-12 lg:px-6">{children}</main>
    </div>
  );
}
