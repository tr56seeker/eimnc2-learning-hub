export default function MissingProfilePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="card max-w-xl rounded-[2rem] p-8 text-center">
        <h1 className="text-2xl font-black text-slate-950">Profile not found</h1>
        <p className="mt-3 text-slate-600">
          Your login account exists, but your learner/teacher profile is missing. Ask the system administrator to create or repair your profile in Supabase.
        </p>
      </div>
    </main>
  );
}
