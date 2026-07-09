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
  ["Submissions", "/teacher/submissions"],
  ["Gradebook", "/teacher/gradebook"]
];

export function PortalShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const links = profile.role === "learner" ? learnerLinks : teacherLinks;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/portal" className="text-lg font-black text-slate-950">
              EIM NC II Learning Hub
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">{profile.role} portal</p>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700">
                {label}
              </Link>
            ))}
          </nav>
          <form action={signOutAction}>
            <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
