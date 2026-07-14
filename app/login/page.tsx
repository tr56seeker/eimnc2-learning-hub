import Link from "next/link";
import { FlashMessage } from "@/components/FlashMessage";
import { loginAction } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string; next?: string }> }) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="card w-full max-w-md rounded-[1.75rem] p-7 sm:p-9">
        <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">EIM NC II</Link>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Use the account provided by your EIM teacher to continue lessons, exams, and outputs.</p>

        <FlashMessage message={params.message} variant="error" className="mt-5" />

        <form action={loginAction} className="mt-7 grid gap-5">
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
            Email or LRN
            <input name="email" type="text" required className="focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 font-normal shadow-sm" placeholder="email@example.com or 123456789012" />
          </label>
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
            Password
            <input name="password" type="password" required className="focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 font-normal shadow-sm" placeholder="Password" />
          </label>
          <button className="rounded-2xl bg-slate-950 px-5 py-3.5 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">
            Login
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          No account yet? <Link href="/signup" className="font-semibold text-teal-700 hover:text-teal-800">Create learner account</Link>
        </p>
      </div>
    </main>
  );
}
