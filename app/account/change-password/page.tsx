import { redirect } from "next/navigation";
import { SectionHeader } from "@/components/SectionHeader";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { changePasswordAction } from "./actions";

export default async function ChangePasswordPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await getCurrentUserAndProfile();

  if (profile.role !== "learner") {
    redirect("/teacher/dashboard");
  }

  if (!profile.must_change_password) {
    redirect("/learner/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="card w-full max-w-lg rounded-[1.75rem] p-7 sm:p-9">
        <SectionHeader
          eyebrow="Account Security"
          title="Change your password"
          description="Use a private password before entering your learner dashboard."
        />

        {params.message ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {params.message}
          </div>
        ) : null}

        <form action={changePasswordAction} className="mt-7 grid gap-5">
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
            New password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 font-normal text-slate-900 shadow-sm shadow-slate-200/40"
            />
          </label>
          <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
            Confirm password
            <input
              name="confirm_password"
              type="password"
              required
              minLength={8}
              className="focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 font-normal text-slate-900 shadow-sm shadow-slate-200/40"
            />
          </label>
          <button className="rounded-2xl bg-slate-950 px-5 py-3.5 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">
            Update Password
          </button>
        </form>
      </section>
    </main>
  );
}
