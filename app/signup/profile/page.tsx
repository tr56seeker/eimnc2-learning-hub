import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";

export default async function MissingProfilePage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;

  if (!params.message) {
    await getCurrentUserAndProfile();
    redirect("/portal");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="card max-w-xl rounded-[1.75rem] p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-950">Profile setup needs attention</h1>
        <p className="mt-3 text-slate-600">
          {params.message}
        </p>
      </div>
    </main>
  );
}
