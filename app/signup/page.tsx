import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signupAction } from "./actions";

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
      <div className="card w-full max-w-xl rounded-[2rem] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-teal-700">Learner registration</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Create learner account</h1>
        <p className="mt-2 text-sm text-slate-500">For teacher/admin accounts, create the user first, then update role in Supabase.</p>

        {params.message ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {params.message}
          </div>
        ) : null}

        <form action={signupAction} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Full name
            <input name="full_name" required className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-normal" placeholder="Juan Dela Cruz" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            LRN / Learner ID <span className="font-normal text-slate-400">optional</span>
            <input name="lrn" className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-normal" placeholder="Optional" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Section
            <select name="section_id" className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-normal">
              <option value="">Select section</option>
              {(sections ?? []).map((section) => (
                <option key={section.id} value={section.id}>{section.name} — SY {section.school_year}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Email
            <input name="email" type="email" required className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Password
            <input name="password" type="password" required minLength={6} className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-normal" />
          </label>
          <button className="rounded-2xl bg-teal-700 px-5 py-3 font-black text-white hover:bg-teal-800">
            Create account
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already registered? <Link href="/login" className="font-bold text-teal-700">Login</Link>
        </p>
      </div>
    </main>
  );
}
