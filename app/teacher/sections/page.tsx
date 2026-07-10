import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { SectionsManagementClient, type ManagedSection } from "./SectionsManagementClient";

type SectionRow = {
  id: string;
  name: string;
  grade_level: number;
  school_year: string;
  is_active: boolean | null;
};

type LearnerCountRow = {
  section_id: string | null;
  status: string | null;
};

function normalizeStatusFilter(value: string | undefined) {
  return value === "active" || value === "inactive" ? value : "all";
}

export default async function TeacherSectionsPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = normalizeStatusFilter(params.status);
  const { profile, supabase } = await requireTeacher();

  const [sectionsResult, learnersResult] = await Promise.all([
    supabase.from("sections").select("id, name, grade_level, school_year, is_active").order("grade_level").order("name").returns<SectionRow[]>(),
    supabase.from("profiles").select("section_id, status").eq("role", "learner").returns<LearnerCountRow[]>()
  ]);

  const learnerCounts = (learnersResult.data ?? []).reduce<Record<string, number>>((counts, learner) => {
    if (!learner.section_id || learner.status === "deleted") return counts;
    counts[learner.section_id] = (counts[learner.section_id] ?? 0) + 1;
    return counts;
  }, {});

  const sections: ManagedSection[] = (sectionsResult.data ?? [])
    .filter((section) => statusFilter === "all" || (statusFilter === "active" ? section.is_active !== false : section.is_active === false))
    .map((section) => ({
      id: section.id,
      name: section.name,
      gradeLevel: section.grade_level,
      schoolYear: section.school_year,
      isActive: section.is_active !== false,
      learnerCount: learnerCounts[section.id] ?? 0
    }));

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Section Management" description="Create and maintain the official section registry for EIM classes." />

      {params.message ? <div className="mb-7 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 font-semibold text-teal-800">{params.message}</div> : null}

      <form action="/teacher/sections" className="card mb-6 flex flex-col gap-3 rounded-[1.5rem] p-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Status
          <select name="status" defaultValue={statusFilter} className="focus-ring min-h-11 min-w-48 rounded-xl border border-slate-200 bg-white px-4 py-2 font-normal">
            <option value="all">All sections</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-teal-200 hover:text-teal-700">Apply Filter</button>
      </form>

      <SectionsManagementClient sections={sections} />
    </PortalShell>
  );
}
