import { FlashMessage } from "@/components/FlashMessage";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { publishDueLessons } from "@/lib/lesson-scheduling";
import { firstRelation } from "@/lib/relations";
import { createLessonAction } from "./actions";
import Link from "next/link";

const inputClass = "focus-ring min-h-12 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 px-4 py-3 font-normal shadow-sm";
const textareaClass = "focus-ring rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 p-4 font-normal shadow-sm";

type LessonListRow = {
  id: string;
  title: string;
  summary: string | null;
  published: boolean;
  scheduled_publish_at: string | null;
  competencies: { code: string | null; title: string | null } | { code: string | null; title: string | null }[] | null;
  lesson_blocks: { count: number } | { count: number }[] | null;
};

export default async function TeacherLessonsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireTeacher();

  await publishDueLessons();

  const [lessonsResult, competenciesResult] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, title, summary, published, scheduled_publish_at, competencies(code, title), lesson_blocks(count)")
      .order("created_at", { ascending: false })
      .returns<LessonListRow[]>(),
    supabase.from("competencies").select("id, code, title").eq("is_active", true).order("order_index")
  ]);

  const lessons = lessonsResult.data ?? [];

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Lesson Manager" description="Create and publish EIM competency-based lessons." />

      <FlashMessage message={params.error} variant="error" className="mb-7" />
      <FlashMessage message={params.message} variant="success" className="mb-7" />

      <div className="grid gap-8 xl:grid-cols-[0.72fr_1.28fr]">
        <section className="card rounded-[1.75rem] p-7 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Create Lesson</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Create the lesson shell here, then use Lesson Studio to build the full module with content blocks.</p>
          <form action={createLessonAction} className="mt-7 grid gap-5">
            <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Competency
              <select name="competency_id" className={inputClass}>
                <option value="">Select competency</option>
                {(competenciesResult.data ?? []).map((competency) => (
                  <option key={competency.id} value={competency.id}>{competency.code} - {competency.title}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Title
              <input name="title" required className={inputClass} />
            </label>
            <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Summary
              <textarea name="summary" rows={3} className={textareaClass} />
            </label>
            <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Starter notes (optional)
              <textarea name="content_md" rows={4} className={textareaClass} placeholder="Add a short outline, or leave blank and build with content blocks in Studio." />
            </label>
            <label className="grid gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Estimated minutes
              <input name="estimated_minutes" type="number" min={1} defaultValue={45} className={inputClass} />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/70 p-4 text-sm font-medium text-slate-700 dark:text-slate-300">
              <input name="published" type="checkbox" /> Publish immediately after creation
            </label>
            <button className="rounded-2xl bg-slate-950 px-5 py-3.5 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">Create Lesson</button>
          </form>
        </section>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-black/30">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-700/80 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Existing Lessons</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Open a lesson to manage its content blocks.</p>
            </div>
            <span className="shrink-0 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
            </span>
          </div>

          {lessons.length ? (
            <div>
              <div className="hidden grid-cols-[100px_minmax(0,1fr)_80px_72px_auto] items-center gap-4 border-b border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/80 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 lg:grid sm:px-6">
                <span>Competency</span>
                <span>Lesson Title</span>
                <span>Status</span>
                <span>Blocks</span>
                <span className="text-right">Action</span>
              </div>

              <div className="divide-y divide-slate-200/70 dark:divide-slate-700/70">
                {lessons.map((lesson) => {
                  const competency = firstRelation(lesson.competencies);
                  const blockCount = firstRelation(lesson.lesson_blocks)?.count ?? 0;

                  return (
                    <div
                      key={lesson.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-5 py-4 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/60 sm:px-6 lg:grid-cols-[100px_minmax(0,1fr)_80px_72px_auto] lg:gap-4"
                    >
                      <span className="col-start-1 row-start-1 w-fit rounded-full bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-teal-700 dark:text-teal-400 lg:col-start-1">
                        {competency?.code ?? "EIM"}
                      </span>

                      <div className="col-span-2 row-start-2 min-w-0 lg:col-span-1 lg:col-start-2 lg:row-start-1">
                        <h3 className="text-sm font-semibold leading-5 text-slate-950 dark:text-slate-100">{lesson.title}</h3>
                        {lesson.summary ? <p className="mt-0.5 hidden truncate text-xs leading-5 text-slate-500 dark:text-slate-400 sm:block">{lesson.summary}</p> : null}
                      </div>

                      <span
                        className={
                          lesson.published
                            ? "col-start-2 row-start-1 w-fit justify-self-end rounded-full bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 text-[11px] font-semibold text-teal-700 dark:text-teal-400 lg:col-start-3 lg:justify-self-start"
                            : lesson.scheduled_publish_at
                              ? "col-start-2 row-start-1 w-fit justify-self-end rounded-full bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400 lg:col-start-3 lg:justify-self-start"
                              : "col-start-2 row-start-1 w-fit justify-self-end rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 lg:col-start-3 lg:justify-self-start"
                        }
                      >
                        {lesson.published
                          ? "Published"
                          : lesson.scheduled_publish_at
                            ? `Scheduled ${new Date(lesson.scheduled_publish_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}`
                            : "Draft"}
                      </span>

                      <span className="col-start-1 row-start-3 text-xs font-medium text-slate-500 dark:text-slate-400 lg:col-start-4 lg:row-start-1">
                        {blockCount} block{blockCount === 1 ? "" : "s"}
                      </span>

                      <Link
                        href={`/teacher/lessons/${lesson.id}/studio`}
                        className="col-start-2 row-start-3 inline-flex min-h-9 items-center justify-center justify-self-end rounded-xl border border-teal-200 dark:border-teal-800/50 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-teal-700 dark:text-teal-400 transition hover:bg-teal-50 dark:hover:bg-teal-950/40 lg:col-start-5 lg:row-start-1"
                      >
                        Open Studio
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No lessons yet. Create the first lesson using the form.</p>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
