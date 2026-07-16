import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { PortalNav, type NavItem } from "@/components/PortalNav";
import { PresenceHeartbeat } from "@/components/presence/PresenceHeartbeat";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Profile } from "@/lib/types";

const learnerLinks: NavItem[] = [
  { label: "Dashboard", href: "/learner/dashboard" },
  { label: "Lessons", href: "/learner/lessons" },
  { label: "Exams", href: "/learner/exams" },
  { label: "Submissions", href: "/learner/submissions" },
  { label: "Projects", href: "/learner/projects" },
  { label: "Grades", href: "/learner/grades" },
  { label: "Achievements", href: "/learner/achievements" }
];

const teacherLinks: NavItem[] = [
  { label: "Dashboard", href: "/teacher/dashboard" },
  {
    label: "Learners",
    items: [
      { label: "Learners", href: "/teacher/learners" },
      { label: "Sections", href: "/teacher/sections" }
    ]
  },
  {
    label: "Content",
    items: [
      { label: "Lessons", href: "/teacher/lessons" },
      { label: "Activities", href: "/teacher/activities" },
      { label: "Projects", href: "/teacher/projects" }
    ]
  },
  {
    label: "Assessments",
    items: [
      { label: "Exams", href: "/teacher/exams" },
      { label: "Question Bank", href: "/teacher/question-bank" },
      { label: "Submissions", href: "/teacher/submissions" },
      { label: "Gradebook", href: "/teacher/gradebook" },
      { label: "Incidents", href: "/teacher/incidents" }
    ]
  },
  {
    label: "Insights",
    items: [
      { label: "Reports", href: "/teacher/reports" },
      { label: "Achievements", href: "/teacher/achievements" }
    ]
  }
];

const adminGroup: NavItem = {
  label: "Administration",
  items: [
    { label: "Staff Accounts", href: "/teacher/admin/teachers" },
    { label: "Academic Years", href: "/teacher/admin/academic-years" },
    { label: "Audit Log", href: "/teacher/admin/audit-logs" }
  ]
};

export function PortalShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const links = profile.role === "learner" ? learnerLinks : profile.role === "admin" ? [...teacherLinks, adminGroup] : teacherLinks;
  const portalLabel = profile.role === "learner" ? "Learner Portal" : "Teacher Portal";

  return (
    <div className="min-h-screen">
      <PresenceHeartbeat />
      <header className="print:hidden sticky top-0 z-40 border-b border-slate-200/70 bg-white/88 shadow-sm shadow-slate-200/30 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/88">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="min-w-0">
            <Link href="/portal" className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              EIM NC II Learning Hub
            </Link>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-400">{portalLabel}</p>
          </div>
          <PortalNav items={links} />
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <form action={signOutAction}>
              <button className="rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-300">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-10 sm:py-12 lg:px-6 print:px-0 print:py-0">{children}</main>
    </div>
  );
}
