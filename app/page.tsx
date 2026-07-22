import Image from "next/image";
import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";

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
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <section className="py-14 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-amber-400">Tabunoc National High School</p>
          <div className="mt-4 inline-flex rounded-full border border-teal-200/80 bg-teal-50/80 px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm dark:bg-amber-950/40 dark:text-amber-300">
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
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] shadow-xl shadow-slate-950/10 sm:aspect-[16/9] lg:aspect-[21/9] dark:shadow-black/30">
            <Image
              src="/images/login-background.png"
              alt="Tabunoc NHS learners practicing hands-on electrical installation and maintenance skills together"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Real Tabunoc NHS Learners</p>
              <p className="mt-2 max-w-xl text-lg font-semibold leading-7 text-white sm:text-2xl sm:leading-9">
                Hands-on practice today becomes real-world skill tomorrow.
              </p>
            </div>
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

      <PublicFooter />
    </main>
  );
}
