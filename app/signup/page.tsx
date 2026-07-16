import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="card w-full max-w-xl rounded-[1.75rem] p-7 text-center sm:p-9">
        <Link href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-amber-400">EIM NC II</Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Accounts are set up by your teacher</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-slate-600 dark:text-slate-400">
          There&apos;s no self-registration for the Learning Hub. Your teacher or your school&apos;s EIM adviser creates your learner account and gives you a login ID and temporary password directly.
        </p>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
          Already have those details? Head to the login page below.
        </p>
        <Link
          href="/login"
          className="mt-7 inline-flex rounded-2xl bg-slate-950 px-6 py-3.5 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:bg-teal-700 dark:shadow-black/20"
        >
          Go to Login
        </Link>
      </div>
    </main>
  );
}
