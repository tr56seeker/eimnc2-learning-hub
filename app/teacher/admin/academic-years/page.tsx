import { EmptyState } from "@/components/EmptyState";
import { FlashMessage } from "@/components/FlashMessage";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireAdmin } from "@/lib/auth";
import { createAcademicYearAction, createTermAction, setCurrentAcademicYearAction, setCurrentTermAction } from "./actions";

type AcademicYear = {
  id: string;
  year_label: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
};

type Term = {
  id: string;
  academic_year_id: string;
  name: string;
  order_index: number;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
};

const fieldClass = "focus-ring min-h-11 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm font-normal text-slate-900 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-100";

export default async function AcademicYearsAdminPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireAdmin();

  const [{ data: academicYears }, { data: terms }] = await Promise.all([
    supabase.from("academic_years").select("id, year_label, start_date, end_date, is_current").order("start_date", { ascending: false }).returns<AcademicYear[]>(),
    supabase.from("terms").select("id, academic_year_id, name, order_index, start_date, end_date, is_current").order("order_index").returns<Term[]>()
  ]);

  const termsByYear = new Map<string, Term[]>();
  for (const term of terms ?? []) {
    if (!termsByYear.has(term.academic_year_id)) termsByYear.set(term.academic_year_id, []);
    termsByYear.get(term.academic_year_id)!.push(term);
  }

  return (
    <PortalShell profile={profile}>
      <SectionHeader
        eyebrow="Administration"
        title="Academic Years &amp; Terms"
        description="Manage the school-year and term structure used to scope reports going forward."
      />

      <FlashMessage message={params.error} variant="error" className="mb-7" />
      <FlashMessage message={params.message} variant="success" className="mb-7" />

      <form action={createAcademicYearAction} className="card mb-8 grid gap-4 rounded-[1.5rem] p-6 sm:grid-cols-4 sm:items-end">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2 dark:text-slate-300">
          School Year Label
          <input name="year_label" required placeholder="2026-2027" className={fieldClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Start Date
          <input name="start_date" type="date" className={fieldClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          End Date
          <input name="end_date" type="date" className={fieldClass} />
        </label>
        <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-teal-700 sm:col-span-4 sm:w-fit">
          Add School Year
        </button>
      </form>

      {!academicYears?.length ? (
        <EmptyState title="No school years yet" message="Add your first school year above to start structuring terms and reports." />
      ) : (
        <div className="grid gap-5">
          {academicYears.map((year) => (
            <div key={year.id} className="card rounded-[1.5rem] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-950 dark:text-slate-100">{year.year_label}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                    {year.start_date ?? "No start date"} – {year.end_date ?? "No end date"}
                  </p>
                </div>
                {year.is_current ? (
                  <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">Current</span>
                ) : (
                  <form action={setCurrentAcademicYearAction.bind(null, year.id)}>
                    <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-teal-200 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-teal-400">
                      Set as Current
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-5 grid gap-2">
                {(termsByYear.get(year.id) ?? []).map((term) => (
                  <div key={term.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/60 px-4 py-3 dark:border-slate-700/70 dark:bg-slate-800/60">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{term.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {term.start_date ?? "No start date"} – {term.end_date ?? "No end date"}
                      </p>
                    </div>
                    {term.is_current ? (
                      <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">Current</span>
                    ) : (
                      <form action={setCurrentTermAction.bind(null, term.id)}>
                        <button className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-teal-200 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-teal-400">
                          Set as Current
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </div>

              <form action={createTermAction} className="mt-4 flex flex-wrap items-end gap-3">
                <input type="hidden" name="academic_year_id" value={year.id} />
                <label className="grid gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Term Name
                  <input name="name" required placeholder="First Term" className={`${fieldClass} min-h-10 py-2`} />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Start Date
                  <input name="start_date" type="date" className={`${fieldClass} min-h-10 py-2`} />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  End Date
                  <input name="end_date" type="date" className={`${fieldClass} min-h-10 py-2`} />
                </label>
                <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-teal-200 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-teal-400">
                  Add Term
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
