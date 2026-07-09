import Link from "next/link";

type WelcomeAction = {
  href: string;
  label: string;
};

type WelcomeHeroProps = {
  fullName: string | null;
  role: "learner" | "teacher" | "admin";
  subtitle: string;
  primaryAction: WelcomeAction;
  secondaryAction?: WelcomeAction;
};

function firstNameFrom(fullName: string | null) {
  const cleanName = fullName?.trim();
  return cleanName ? cleanName.split(/\s+/)[0] : "there";
}

export function WelcomeHero({
  fullName,
  role,
  subtitle,
  primaryAction,
  secondaryAction
}: WelcomeHeroProps) {
  const firstName = firstNameFrom(fullName);
  const label = role === "learner" ? "Learner Dashboard" : "Teacher Workspace";

  return (
    <section className="overflow-hidden rounded-3xl border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,253,250,0.88)_48%,rgba(239,246,255,0.86))] p-7 shadow-xl shadow-slate-200/50 sm:p-9">
      <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">{label}</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Hi {firstName}, welcome back.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
          <Link
            href={primaryAction.href}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700"
          >
            {primaryAction.label}
          </Link>
          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-700"
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
