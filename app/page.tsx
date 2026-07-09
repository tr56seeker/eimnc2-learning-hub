import Link from "next/link";

const features = [
  ["Lessons", "Competency-based reading built for EIM NC II topics."],
  ["Exams", "Scheduled quizzes with question bank support."],
  ["Output Submission", "Learners submit links, notes, photos, PDFs, or video evidence."],
  ["Grades Dashboard", "Scores and mastery estimates stay easy to track."],
  ["Teacher Tools", "Manage lessons, exams, questions, submissions, and grades."]
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col rounded-[1.75rem] border border-slate-200/70 bg-white/82 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl sm:p-8">
        <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Tabunoc National High School</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">EIM NC II Learning Hub</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="rounded-full border border-slate-200/80 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-700">
              Login
            </Link>
            <Link href="/signup" className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">
              Create Account
            </Link>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div>
            <div className="inline-flex rounded-full border border-teal-200/80 bg-teal-50/80 px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm">
              School-ready LMS-lite for distance learning days
            </div>
            <h2 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-7xl">
              A calm digital classroom for EIM learners.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Lessons, exams, output submissions, and grade tracking in one focused hub for Electrical Installation and Maintenance NC II.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/portal" className="rounded-2xl bg-slate-950 px-6 py-3.5 text-center font-semibold text-white shadow-xl shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">
                Open Portal
              </Link>
              <Link href="/login" className="rounded-2xl border border-slate-200/80 bg-white/80 px-6 py-3.5 text-center font-semibold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-700">
                Login
              </Link>
              <Link href="/signup" className="rounded-2xl border border-slate-200/80 bg-white/60 px-6 py-3.5 text-center font-semibold text-slate-700 hover:-translate-y-0.5 hover:bg-white/80">
                Create Account
              </Link>
            </div>
          </div>

          <div className="card rounded-[1.75rem] p-4 sm:p-5">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/15">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-teal-100">Learning Snapshot</p>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">Today</span>
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  ["Current Competency", "Prepare electrical tools and materials"],
                  ["Pending Exam", "Safety and OHS Quiz"],
                  ["Output", "Tool identification evidence"],
                  ["Progress", "68% overall completion"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">{label}</p>
                    <p className="mt-1 font-medium leading-6">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div id="features" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {features.map(([title, text]) => (
            <div key={title} className="rounded-[1.5rem] border border-white/70 bg-white/64 p-5 shadow-sm backdrop-blur">
              <p className="font-semibold text-slate-950">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
