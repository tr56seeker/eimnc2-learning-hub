import { signOutAction } from "@/app/actions/auth";

export default function InactiveAccountPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="card w-full max-w-xl rounded-[1.75rem] p-8 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-700 dark:text-red-300">Account inactive</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Your account is inactive.</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-600 dark:text-slate-400">
          Your account is inactive. Please contact your school administrator for assistance.
        </p>
        <form action={signOutAction} className="mt-7">
          <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-teal-700 dark:shadow-black/20">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
