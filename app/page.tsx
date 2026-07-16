import Link from "next/link";

const learnerFeatures = [
  { glyph: "Le", tone: "teal", title: "Lessons", text: "Read competency-based EIM topics at your own pace, with progress that picks up right where you left off." },
  { glyph: "Ex", tone: "violet", title: "Exams", text: "Take scheduled quizzes and term exams with clear time limits and instructions." },
  { glyph: "Ou", tone: "indigo", title: "Output Submission", text: "Submit links, notes, photos, PDFs, or video evidence for your activities and projects." },
  { glyph: "Gr", tone: "amber", title: "Grades & Progress", text: "See your scores, completion, and mastery estimates in one place, updated as you go." }
] as const;

const steps = [
  { number: "1", title: "Get your account", text: "Your teacher or EIM adviser creates your learner account and gives you a login ID and password." },
  { number: "2", title: "Learn at your pace", text: "Read lessons, complete activities, and take exams whenever fits your schedule." },
  { number: "3", title: "Track your progress", text: "Watch your completion, grades, and achievements grow as you finish each competency." }
] as const;

const toneClasses: Record<string, string> = {
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
  indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
};

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 px-5 py-4 backdrop-blur-lg sm:px-8 dark:border-slate-800/70 dark:bg-slate-950/70">
        <nav className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-amber-400">Tabunoc National High School</p>
            <h1 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">EIM NC II Learning Hub</h1>
          </div>
          <Link
            href="/login"
            className="focus-ring inline-flex w-fit rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-700 active:scale-[0.97] dark:border-slate-700 dark:text-slate-300 dark:hover:border-amber-700 dark:hover:text-amber-300"
          >
            Login
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <section className="py-14 lg:py-20">
          <div className="inline-flex rounded-full border border-teal-200/80 bg-teal-50/80 px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm dark:bg-amber-950/40 dark:text-amber-300">
            Built for Electrical Installation and Maintenance NC II
          </div>
          <h2 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-7xl dark:text-slate-100">
            Learn EIM at your own pace.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            Read lessons, submit outputs, take exams, and watch your progress grow, all in one calm, focused place built for Tabunoc NHS learners.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link href="/login" className="rounded-2xl bg-slate-950 px-6 py-3.5 text-center font-semibold text-white shadow-xl shadow-slate-950/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:bg-teal-700 dark:shadow-black/20">
              Login
            </Link>
            <Link href="/signup" className="text-sm font-semibold text-slate-600 hover:text-teal-700 dark:text-slate-400 dark:hover:text-amber-400 active:scale-[0.97]">
              New here? Ask your teacher for an account →
            </Link>
          </div>
        </section>

        <section className="border-t border-slate-200/70 py-10 dark:border-slate-800/70">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-amber-400">Getting Started</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="card rounded-[1.5rem] p-6">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-sm font-semibold text-white dark:bg-amber-500 dark:text-slate-950">
                  {step.number}
                </span>
                <p className="mt-4 font-semibold text-slate-950 dark:text-slate-100">{step.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="border-t border-slate-200/70 py-10 dark:border-slate-800/70">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-amber-400">What You Get</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {learnerFeatures.map((feature) => (
              <div key={feature.title} className="card rounded-[1.5rem] p-6">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${toneClasses[feature.tone]}`}>
                  {feature.glyph}
                </span>
                <p className="mt-4 font-semibold text-slate-950 dark:text-slate-100">{feature.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{feature.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Teaching this subject? <Link href="/login" className="font-semibold text-teal-700 hover:underline dark:text-amber-400">Sign in for teacher tools →</Link>
          </p>
        </section>
      </div>

      <footer className="border-t border-slate-200/70 px-5 py-8 text-center text-xs text-slate-500 sm:px-8 dark:border-slate-800/70 dark:text-slate-400">
        © {year} Tabunoc National High School · EIM NC II Learning Hub
      </footer>
    </main>
  );
}
