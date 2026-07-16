import { FlashMessage } from "@/components/FlashMessage";
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

type TeacherProfileRow = {
  id: string;
  full_name: string;
};

type TeacherAssignmentRow = {
  teacher_id: string;
  section_id: string;
};

function normalizeStatusFilter(value: string | undefined) {
  return value === "active" || value === "inactive" ? value : "all";
}

export default async function TeacherSectionsPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string; status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = normalizeStatusFilter(params.status);
  const { profile, supabase } = await requireTeacher();

  const [sectionsResult, learnersResult, teachersResult, assignmentsResult] = await Promise.all([
    supabase.from("sections").select("id, name, grade_level, school_year, is_active").order("grade_level").order("name").returns<SectionRow[]>(),
    supabase.from("profiles").select("section_id, status").eq("role", "learner").returns<LearnerCountRow[]>(),
    supabase.from("profiles").select("id, full_name").in("role", ["teacher", "admin"]).order("full_name").returns<TeacherProfileRow[]>(),
    supabase.from("teacher_assignments").select("teacher_id, section_id").returns<TeacherAssignmentRow[]>()
  ]);

  const learnerCounts = (learnersResult.data ?? []).reduce<Record<string, number>>((counts, learner) => {
    if (!learner.section_id || learner.status === "deleted") return counts;
    counts[learner.section_id] = (counts[learner.section_id] ?? 0) + 1;
    return counts;
  }, {});

  const assignedTeacherIdsBySection = (assignmentsResult.data ?? []).reduce<Record<string, string[]>>((map, row) => {
    (map[row.section_id] ??= []).push(row.teacher_id);
    return map;
  }, {});

  const teachers = teachersResult.data ?? [];

  const sections: ManagedSection[] = (sectionsResult.data ?? [])
    .filter((section) => statusFilter === "all" || (statusFilter === "active" ? section.is_active !== false : section.is_active === false))
    .map((section) => ({
      id: section.id,
      name: section.name,
      gradeLevel: section.grade_level,
      schoolYear: section.school_year,
      isActive: section.is_active !== false,
      learnerCount: learnerCounts[section.id] ?? 0,
      assignedTeacherIds: assignedTeacherIdsBySection[section.id] ?? []
    }));

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Section Management" description="Create and maintain the official section registry for EIM classes." />

      <FlashMessage message={params.error} variant="error" className="mb-7" />
      <FlashMessage message={params.message} variant="success" className="mb-7" />

      <form action="/teacher/sections" className="card mb-6 flex flex-col gap-3 rounded-[1.5rem] p-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Status
          <select name="status" defaultValue={statusFilter} className="focus-ring min-h-11 min-w-48 rounded-xl border border-slate-200 bg-white px-4 py-2 font-normal dark:border-slate-700 dark:bg-slate-900">
            <option value="all">All sections</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-teal-200 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-800 dark:hover:text-teal-400">Apply Filter</button>
      </form>

      <SectionsManagementClient sections={sections} teachers={teachers} />
    </PortalShell>
  );
}
