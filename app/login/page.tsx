import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FlashMessage } from "@/components/FlashMessage";
import { ResetThemeOnLogin } from "@/components/ResetThemeOnLogin";
import { createClient } from "@/lib/supabase/server";
import { loginAction } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string; next?: string }> }) {
  const params = await searchParams;

  // Middleware already redirects an authenticated visitor away from this page,
  // but that check can occasionally miss (a transient error from Supabase's
  // getUser() call reads as "no user" for that one request). Checking again
  // here means a logged-in visitor is never shown the login form, even if
  // middleware's redirect didn't fire.
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user) redirect("/portal");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <ResetThemeOnLogin />
      <Image
        src="/images/login-background.png"
        alt=""
        fill
        priority
        aria-hidden="true"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-white/70 dark:bg-slate-950/75" />
      <div className="card relative w-full max-w-md rounded-[1.75rem] p-7 sm:p-9">
        <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-amber-400">EIM NC II</Link>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Use the account provided by your EIM teacher to continue lessons, exams, and outputs.</p>

        <FlashMessage message={params.message} variant="error" className="mt-5" />

        <form action={loginAction} className="mt-7 grid gap-5">
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Email or LRN
            <input name="email" type="text" required className="focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 font-normal shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80" placeholder="email@example.com or 123456789012" />
          </label>
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Password
            <input name="password" type="password" required className="focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 font-normal shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80" placeholder="Password" />
          </label>
          <button className="rounded-2xl bg-slate-950 px-5 py-3.5 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:bg-teal-700 dark:shadow-black/20">
            Login
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          No account yet? <Link href="/signup" className="font-semibold text-teal-700 hover:text-teal-800 dark:text-amber-400 dark:hover:text-amber-300 active:scale-[0.97]">Ask your teacher</Link>
        </p>
      </div>
    </main>
  );
}
