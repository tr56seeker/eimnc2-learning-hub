import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import type { Profile } from "@/lib/types";

const learnerLinks = [
  ["Dashboard", "/learner/dashboard"],
  ["Lessons", "/learner/lessons"],
  ["Exams", "/learner/exams"],
  ["Submissions", "/learner/submissions"],
  ["Grades", "/learner/grades"]
];

const teacherLinks = [
  ["Dashboard", "/teacher/dashboard"],
  ["Lessons", "/teacher/lessons"],
  ["Exams", "/teacher/exams"],
  ["Question Bank", "/teacher/question-bank"],
  ["Submissions", "/teacher/submissions"],
  ["Gradebook", "/teacher/gradebook"]
];

export function PortalShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const links = profile.role === "learner" ? learnerLinks : teacherLinks;
  const portalLabel = profile.role === "learner" ? "Learner Portal" : "Teacher Portal";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/78 shadow-sm shadow-slate-200/40 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/portal" className="text-lg font-black tracking-tight text-slate-950">
              EIM NC II Learning Hub
            </Link>
            <p className="text-xs font-semibold tracking-[0.18em] text-teal-700">{portalLabel}</p>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="whitespace-nowrap rounded-full border border-transparent px-4 py-2 text-sm font-bold text-slate-600 hover:-translate-y-0.5 hover:border-white/80 hover:bg-white/80 hover:text-teal-700 hover:shadow-sm">
                {label}
              </Link>
            ))}
          </nav>
          <form action={signOutAction}>
            <button className="rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-10">{children}</main>
    </div>
  );
}
