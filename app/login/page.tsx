import Link from "next/link";
import { loginAction } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string; next?: string }> }) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-teal-700">EIM NC II</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Login to Learning Hub</h1>
        <p className="mt-2 text-sm text-slate-500">Use the account provided by your EIM teacher.</p>

        {params.message ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {params.message}
          </div>
        ) : null}

        <form action={loginAction} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Email
            <input name="email" type="email" required className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-normal" placeholder="learner@example.com" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Password
            <input name="password" type="password" required className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-normal" placeholder="••••••••" />
          </label>
          <button className="rounded-2xl bg-teal-700 px-5 py-3 font-black text-white hover:bg-teal-800">
            Login
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          No account yet? <Link href="/signup" className="font-bold text-teal-700">Create learner account</Link>
        </p>
      </div>
    </main>
  );
}
