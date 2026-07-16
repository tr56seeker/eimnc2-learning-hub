import { FlashMessage } from "@/components/FlashMessage";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { CompetenciesManagementClient, type ManagedCompetency } from "./CompetenciesManagementClient";

type CompetencyRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  grade_level: number | null;
  order_index: number;
  is_active: boolean | null;
};

function normalizeStatusFilter(value: string | undefined) {
  return value === "archived" || value === "all" ? value : "active";
}

export default async function TeacherCompetenciesPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string; status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = normalizeStatusFilter(params.status);
  const { profile, supabase } = await requireTeacher();

  const { data } = await supabase
    .from("competencies")
    .select("id, code, title, description, grade_level, order_index, is_active")
    .order("order_index", { ascending: true })
    .returns<CompetencyRow[]>();

  const competencies: ManagedCompetency[] = (data ?? [])
    .filter((row) => statusFilter === "all" || (statusFilter === "active" ? row.is_active !== false : row.is_active === false))
    .map((row) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      gradeLevel: row.grade_level,
      isActive: row.is_active !== false
    }));

  return (
    <PortalShell profile={profile}>
      <SectionHeader
        eyebrow="Teacher"
        title="Competency Management"
        description="Add, reorder, and archive the competencies used to categorize lessons, question bank items, exams, and projects."
      />

      <FlashMessage message={params.error} variant="error" className="mb-7" />
      <FlashMessage message={params.message} variant="success" className="mb-7" />

      <form action="/teacher/competencies" className="card mb-6 flex flex-col gap-3 rounded-[1.5rem] p-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Status
          <select name="status" defaultValue={statusFilter} className="focus-ring min-h-11 min-w-48 rounded-xl border border-slate-200 bg-white px-4 py-2 font-normal dark:border-slate-700 dark:bg-slate-900">
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All competencies</option>
          </select>
        </label>
        <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-teal-200 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-800 dark:hover:text-teal-400">Apply Filter</button>
      </form>

      <CompetenciesManagementClient competencies={competencies} />
    </PortalShell>
  );
}
