import Link from "next/link";
import { FlashMessage } from "@/components/FlashMessage";
import { createClient } from "@/lib/supabase/server";
import { signupAction } from "./actions";

const inputClass = "focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 font-normal shadow-sm shadow-slate-200/40 dark:border-slate-700/80 dark:bg-slate-900/90 dark:shadow-black/20";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: sections } = await supabase
    .from("sections")
    .select("id, name, grade_level, school_year")
    .order("grade_level")
    .order("name");

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="card w-full max-w-xl rounded-[1.75rem] p-7 sm:p-9">
        <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">Learner Registration</Link>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Create learner account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">For teacher/admin accounts, create the user first, then update role in Supabase.</p>

        <FlashMessage message={params.message} variant="error" className="mt-5" />

        <form action={signupAction} className="mt-7 grid gap-5">
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Full name
            <input name="full_name" required className={inputClass} placeholder="Juan Dela Cruz" />
          </label>
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            LRN / Learner ID <span className="font-normal text-slate-400 dark:text-slate-500">optional</span>
            <input name="lrn" className={inputClass} placeholder="Optional" />
          </label>
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Section
            <select name="section_id" className={inputClass}>
              <option value="">Select section</option>
              {(sections ?? []).map((section) => (
                <option key={section.id} value={section.id}>{section.name} - SY {section.school_year}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Grade level
            <select name="grade_level" className={inputClass}>
              <option value="">Select grade level</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
            </select>
          </label>
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Email
            <input name="email" type="email" required className={inputClass} />
          </label>
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Password
            <input name="password" type="password" required minLength={6} className={inputClass} />
          </label>
          <button className="rounded-2xl bg-slate-950 px-5 py-3.5 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700 dark:shadow-black/20">
            Create account
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          Already registered? <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300">Login</Link>
        </p>
      </div>
    </main>
  );
}
