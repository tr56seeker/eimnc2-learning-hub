import { FlashMessage } from "@/components/FlashMessage";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { firstRelation } from "@/lib/relations";
import { ActivitiesManagementClient, type LessonOption, type ManagedActivity, type RubricCriterion } from "./ActivitiesManagementClient";

type AssignmentRow = {
  id: string;
  title: string;
  instructions: string | null;
  lesson_id: string | null;
  due_at: string | null;
  max_score: number | null;
  submission_type: string;
  rubric: { criteria: RubricCriterion[] } | null;
  is_active: boolean | null;
  expected_filename_pattern: string | null;
  lessons: { title: string } | { title: string }[] | null;
  submissions: { count: number } | { count: number }[] | null;
};

function normalizeStatusFilter(value: string | undefined) {
  return value === "archived" || value === "all" ? value : "active";
}

export default async function TeacherActivitiesPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string; status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = normalizeStatusFilter(params.status);
  const { profile, supabase } = await requireTeacher();

  const [assignmentsResult, lessonsResult] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, title, instructions, lesson_id, due_at, max_score, submission_type, rubric, is_active, expected_filename_pattern, lessons(title), submissions(count)")
      .order("due_at", { ascending: true })
      .returns<AssignmentRow[]>(),
    supabase.from("lessons").select("id, title").order("title").returns<LessonOption[]>()
  ]);

  const activities: ManagedActivity[] = (assignmentsResult.data ?? [])
    .filter((row) => statusFilter === "all" || (statusFilter === "active" ? row.is_active !== false : row.is_active === false))
    .map((row) => ({
      id: row.id,
      title: row.title,
      instructions: row.instructions,
      lessonId: row.lesson_id,
      lessonTitle: firstRelation(row.lessons)?.title ?? null,
      dueAt: row.due_at,
      maxScore: row.max_score ?? 100,
      submissionType: row.submission_type,
      rubric: row.rubric?.criteria ?? null,
      isActive: row.is_active !== false,
      submissionCount: firstRelation(row.submissions)?.count ?? 0,
      expectedFilenamePattern: row.expected_filename_pattern
    }));

  const lessons = lessonsResult.data ?? [];

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Activity Management" description="Create output tasks learners can submit against, with an optional rubric." />

      <FlashMessage message={params.error} variant="error" className="mb-7" />
      <FlashMessage message={params.message} variant="success" className="mb-7" />

      <form action="/teacher/activities" className="card mb-6 flex flex-col gap-3 rounded-[1.5rem] p-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Status
          <select name="status" defaultValue={statusFilter} className="focus-ring min-h-11 min-w-48 rounded-xl border border-slate-200 bg-white px-4 py-2 font-normal dark:border-slate-700 dark:bg-slate-900">
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All activities</option>
          </select>
        </label>
        <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-teal-200 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-800 dark:hover:text-teal-400 active:scale-[0.97]">Apply Filter</button>
      </form>

      <ActivitiesManagementClient activities={activities} lessons={lessons} />
    </PortalShell>
  );
}
