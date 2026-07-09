import Link from "next/link";

const features = [
  "Competency-based EIM lessons",
  "Online quizzes and exams",
  "Output submission links",
  "Learner grade dashboard",
  "Teacher checking dashboard",
  "Mobile-first distance learning"
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 rounded-[2rem] bg-white/75 p-6 shadow-2xl shadow-slate-200/70 ring-1 ring-slate-200 backdrop-blur md:p-10">
        <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-teal-700">Tabunoc National High School</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">EIM NC II Learning Hub</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="rounded-full border border-slate-200 px-5 py-2 text-sm font-bold text-slate-700 hover:border-teal-300 hover:text-teal-700">
              Login
            </Link>
            <Link href="/signup" className="rounded-full bg-teal-700 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-teal-700/20 hover:bg-teal-800">
              Learner Sign Up
            </Link>
          </div>
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-800 ring-1 ring-yellow-200">
              Distance learning portal for class suspension days
            </div>
            <h2 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Learn EIM. Take exams. Submit outputs. Track progress.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              A focused LMS-lite platform for Electrical Installation and Maintenance NC II learners. Built for low-data, mobile-friendly, competency-based learning.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="rounded-2xl bg-teal-700 px-6 py-3 text-center font-extrabold text-white shadow-lg shadow-teal-700/20 hover:bg-teal-800">
                Open Portal
              </Link>
              <Link href="#features" className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-center font-extrabold text-slate-700 hover:border-teal-300 hover:text-teal-700">
                View Features
              </Link>
            </div>
          </div>

          <div className="card rounded-[2rem] p-5">
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <p className="text-sm font-bold text-teal-200">Today&apos;s Learning Status</p>
              <div className="mt-5 grid gap-3">
                {[
                  ["Current Competency", "Prepare electrical tools and materials"],
                  ["Pending Exam", "Safety and OHS Quiz"],
                  ["Output", "Photo evidence of tool identification"],
                  ["Progress", "68% overall completion"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                    <p className="text-xs uppercase tracking-widest text-slate-300">{label}</p>
                    <p className="mt-1 font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div id="features" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature} className="rounded-2xl border border-slate-200 bg-white p-5 font-bold text-slate-700">
              <span className="mr-2 text-teal-700">✓</span>{feature}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
