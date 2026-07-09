import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signupAction } from "./actions";

const inputClass = "focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 font-normal shadow-sm shadow-slate-200/40";

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
        <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Learner Registration</Link>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Create learner account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">For teacher/admin accounts, create the user first, then update role in Supabase.</p>

        {params.message ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {params.message}
          </div>
        ) : null}

        <form action={signupAction} className="mt-7 grid gap-5">
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
            Full name
            <input name="full_name" required className={inputClass} placeholder="Juan Dela Cruz" />
          </label>
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
            LRN / Learner ID <span className="font-normal text-slate-400">optional</span>
            <input name="lrn" className={inputClass} placeholder="Optional" />
          </label>
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
            Section
            <select name="section_id" className={inputClass}>
              <option value="">Select section</option>
              {(sections ?? []).map((section) => (
                <option key={section.id} value={section.id}>{section.name} - SY {section.school_year}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
            Email
            <input name="email" type="email" required className={inputClass} />
          </label>
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
            Password
            <input name="password" type="password" required minLength={6} className={inputClass} />
          </label>
          <button className="rounded-2xl bg-slate-950 px-5 py-3.5 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">
            Create account
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already registered? <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800">Login</Link>
        </p>
      </div>
    </main>
  );
}
