import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { FlashMessage } from "@/components/FlashMessage";
import { LessonBlockForm } from "@/components/lessons/LessonBlockForm";
import { LessonBlockList } from "@/components/lessons/LessonBlockList";
import { PortalShell } from "@/components/PortalShell";
import { requireTeacher } from "@/lib/auth";
import { type LessonBlock } from "@/lib/lesson-blocks";
import { publishDueLessons } from "@/lib/lesson-scheduling";
import { firstRelation } from "@/lib/relations";
import {
  cancelScheduledLessonPublishAction,
  createLessonBlockAction,
  restoreLessonVersionAction,
  scheduleLessonPublishAction,
  setLessonPublishedAction,
  updateLessonInfoAction
} from "./actions";

type LessonRow = {
  id: string;
  competency_id: string | null;
  title: string;
  summary: string | null;
  estimated_minutes: number | null;
  published: boolean;
  scheduled_publish_at: string | null;
  competencies: { code: string | null; title: string | null } | { code: string | null; title: string | null }[] | null;
};

type CompetencyRow = {
  id: string;
  code: string;
  title: string;
};

type VersionRow = {
  id: string;
  created_at: string;
  created_by: string | null;
};

const inputClass = "focus-ring min-h-11 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-normal text-slate-900 shadow-sm";
const labelClass = "grid gap-2 text-sm font-semibold text-slate-700";

export default async function LessonStudioPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile, supabase } = await requireTeacher();

  await publishDueLessons();

  const [lessonResult, blocksResult, competenciesResult, versionsResult] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, competency_id, title, summary, estimated_minutes, published, scheduled_publish_at, competencies(code, title)")
      .eq("id", id)
      .single()
      .returns<LessonRow>(),
    supabase
      .from("lesson_blocks")
      .select("id, lesson_id, block_type, title, body, image_url, caption, alt_text, metadata, display_order, is_active, created_at, updated_at")
      .eq("lesson_id", id)
      .order("display_order")
      .order("created_at")
      .returns<LessonBlock[]>(),
    supabase.from("competencies").select("id, code, title").order("order_index").returns<CompetencyRow[]>(),
    supabase
      .from("lesson_versions")
      .select("id, created_at, created_by")
      .eq("lesson_id", id)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<VersionRow[]>()
  ]);

  const lesson = lessonResult.data;
  if (!lesson) notFound();

  const versions = versionsResult.data ?? [];

  const competency = firstRelation(lesson.competencies);
  const lessonBlocks = blocksResult.data ?? [];
  const competencies = competenciesResult.data ?? [];
  const nextBlockOrder = lessonBlocks.reduce((highest, block) => Math.max(highest, block.display_order ?? 0), 0) + 1;

  return (
    <PortalShell profile={profile}>
      <section className="rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.9)_52%,rgba(239,246,255,0.88))] p-6 shadow-xl shadow-slate-200/45 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
                {competency?.code ?? "EIM"}
              </span>
              <span
                className={
                  lesson.published
                    ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    : lesson.scheduled_publish_at
                      ? "rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                      : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                }
              >
                {lesson.published
                  ? "Published"
                  : lesson.scheduled_publish_at
                    ? `Scheduled for ${new Date(lesson.scheduled_publish_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}`
                    : "Draft"}
              </span>
              <span className="text-sm font-medium text-slate-500">{lesson.estimated_minutes ?? 45} minutes</span>
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Lesson Studio</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{lesson.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{lesson.summary ?? "Add a short lesson summary to guide learners before they begin."}</p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-3 xl:max-w-sm">
            <div className="flex flex-wrap justify-end gap-2.5">
              <Link href="/teacher/lessons" className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
                Back to Lessons
              </Link>
              <Link href={`/learner/lessons/${lesson.id}`} className="inline-flex min-h-10 items-center rounded-xl border border-teal-200 bg-white/80 px-3.5 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50">
                Preview as Learner
              </Link>
              <form action={setLessonPublishedAction.bind(null, lesson.id, !lesson.published)}>
                <button
                  className={
                    lesson.published
                      ? "min-h-10 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                      : "min-h-10 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
                  }
                >
                  {lesson.published ? "Unpublish" : "Publish Now"}
                </button>
              </form>
            </div>

            {!lesson.published ? (
              lesson.scheduled_publish_at ? (
                <form action={cancelScheduledLessonPublishAction.bind(null, lesson.id)}>
                  <button className="min-h-9 rounded-xl border border-sky-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50">
                    Cancel Scheduled Publish
                  </button>
                </form>
              ) : (
                <details className="w-full max-w-xs text-right">
                  <summary className="cursor-pointer list-none text-xs font-semibold text-slate-500 hover:text-teal-700">Schedule for later ▾</summary>
                  <form action={scheduleLessonPublishAction.bind(null, lesson.id)} className="mt-2 flex flex-col items-end gap-2">
                    <input
                      name="scheduled_publish_at"
                      type="datetime-local"
                      required
                      className="focus-ring min-h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-normal text-slate-900"
                    />
                    <button className="min-h-9 rounded-xl bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-700">
                      Schedule Publish
                    </button>
                  </form>
                </details>
              )
            ) : null}
          </div>
        </div>
      </section>

      {query.error ? (
        <FlashMessage message={query.error} variant="error" className="my-6" />
      ) : query.message ? (
        <FlashMessage message={query.message} variant="success" className="my-6" />
      ) : (
        <div className="h-6" />
      )}

      <div className="grid gap-8 xl:grid-cols-[0.78fr_1.22fr]">
        <aside className="grid content-start gap-6">
          <section className="card rounded-[1.75rem] p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Lesson Setup</p>
                <h2 className="mt-1.5 text-xl font-semibold text-slate-950">Lesson Information</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{lessonBlocks.length} blocks</span>
            </div>

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Competency</dt>
                <dd className="mt-1 font-medium text-slate-700">{competency?.code ?? "EIM"} · {competency?.title ?? "Not assigned"}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Estimated time</dt>
                <dd className="mt-1 font-medium text-slate-700">{lesson.estimated_minutes ?? 45} minutes</dd>
              </div>
            </dl>

            <details className="mt-5 rounded-2xl border border-slate-200 bg-white">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-teal-700">Edit Lesson Info</summary>
              <form action={updateLessonInfoAction.bind(null, lesson.id)} className="grid gap-4 border-t border-slate-100 p-4">
                <label className={labelClass}>
                  Title
                  <input name="title" required defaultValue={lesson.title} className={inputClass} />
                </label>
                <label className={labelClass}>
                  Competency
                  <select name="competency_id" defaultValue={lesson.competency_id ?? ""} className={inputClass}>
                    <option value="">No competency selected</option>
                    {competencies.map((item) => (
                      <option key={item.id} value={item.id}>{item.code} - {item.title}</option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Summary
                  <textarea name="summary" rows={4} defaultValue={lesson.summary ?? ""} className={inputClass} />
                </label>
                <label className={labelClass}>
                  Estimated minutes
                  <input name="estimated_minutes" type="number" min={1} defaultValue={lesson.estimated_minutes ?? 45} className={inputClass} />
                </label>
                <button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">Save Lesson Info</button>
              </form>
            </details>
          </section>

          <section className="card rounded-[1.75rem] p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">History</p>
            <h2 className="mt-1.5 text-xl font-semibold text-slate-950">Version History</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">A snapshot is saved every time this lesson is published. Restoring replaces the current content and blocks.</p>

            {versions.length ? (
              <ul className="mt-5 grid gap-2.5">
                {versions.map((version, index) => (
                  <li key={version.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Version {versions.length - index}</p>
                      <p className="text-xs text-slate-500">{new Date(version.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</p>
                    </div>
                    <form action={restoreLessonVersionAction.bind(null, lesson.id, version.id)}>
                      <ConfirmSubmitButton
                        message="Restore this version? Current lesson info and blocks will be replaced."
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-teal-200 hover:text-teal-700"
                      >
                        Restore
                      </ConfirmSubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-slate-500">No versions yet — publish this lesson to save the first snapshot.</p>
            )}
          </section>

          <section className="card rounded-[1.75rem] p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Lesson Builder</p>
            <h2 className="mt-1.5 text-xl font-semibold text-slate-950">Add Content Block</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Build the lesson like a module article using objectives, explanations, media, activities, checks, and reflection.</p>
            <div className="mt-6">
              <LessonBlockForm action={createLessonBlockAction.bind(null, lesson.id)} defaultOrder={nextBlockOrder} submitLabel="Add Content Block" />
            </div>
          </section>
        </aside>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/35">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Content Blocks</h2>
              <p className="mt-1 text-sm text-slate-500">Drag the handle to reorder. Expand a row to edit, activate, or delete it.</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {lessonBlocks.length} block{lessonBlocks.length === 1 ? "" : "s"}
            </span>
          </div>

          <LessonBlockList lessonId={lesson.id} blocks={lessonBlocks} />
        </section>
      </div>
    </PortalShell>
  );
}
