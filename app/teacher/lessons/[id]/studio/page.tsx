import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { FlashMessage } from "@/components/FlashMessage";
import { LessonBlockForm } from "@/components/lessons/LessonBlockForm";
import { PortalShell } from "@/components/PortalShell";
import { requireTeacher } from "@/lib/auth";
import { type LessonBlock, lessonBlockLabels } from "@/lib/lesson-blocks";
import { firstRelation } from "@/lib/relations";
import {
  createLessonBlockAction,
  deleteLessonBlockAction,
  setLessonPublishedAction,
  updateLessonBlockAction,
  updateLessonInfoAction
} from "./actions";

type LessonRow = {
  id: string;
  competency_id: string | null;
  title: string;
  summary: string | null;
  estimated_minutes: number | null;
  published: boolean;
  competencies: { code: string | null; title: string | null } | { code: string | null; title: string | null }[] | null;
};

type CompetencyRow = {
  id: string;
  code: string;
  title: string;
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

  const [lessonResult, blocksResult, competenciesResult] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, competency_id, title, summary, estimated_minutes, published, competencies(code, title)")
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
    supabase.from("competencies").select("id, code, title").order("order_index").returns<CompetencyRow[]>()
  ]);

  const lesson = lessonResult.data;
  if (!lesson) notFound();

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
                    : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                }
              >
                {lesson.published ? "Published" : "Draft"}
              </span>
              <span className="text-sm font-medium text-slate-500">{lesson.estimated_minutes ?? 45} minutes</span>
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Lesson Studio</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{lesson.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{lesson.summary ?? "Add a short lesson summary to guide learners before they begin."}</p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2.5 xl:max-w-sm xl:justify-end">
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
                {lesson.published ? "Unpublish" : "Publish Lesson"}
              </button>
            </form>
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
              <p className="mt-1 text-sm text-slate-500">Expand a row to edit, reorder, activate, or delete it.</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {lessonBlocks.length} block{lessonBlocks.length === 1 ? "" : "s"}
            </span>
          </div>

          {lessonBlocks.length ? (
            <div className="divide-y divide-slate-200/70">
              {lessonBlocks.map((block) => (
                <details key={block.id} className="group">
                  <summary className="cursor-pointer list-none px-5 py-4 hover:bg-slate-50/80 sm:px-6">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 min-w-10 rounded-lg bg-slate-100 px-2 py-1 text-center text-[11px] font-semibold text-slate-500">#{block.display_order ?? 0}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-teal-700">{lessonBlockLabels[block.block_type]}</span>
                          <span className={block.is_active === false ? "rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700" : "rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"}>
                            {block.is_active === false ? "Inactive" : "Active"}
                          </span>
                        </div>
                        <h3 className="mt-2 truncate text-sm font-semibold text-slate-950">{block.title || block.caption || "Untitled block"}</h3>
                        <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-slate-500">{block.body || block.image_url || "No preview content."}</p>
                      </div>
                      <span aria-hidden="true" className="mt-2 text-sm font-semibold text-slate-400 transition group-open:rotate-180">⌄</span>
                    </div>
                  </summary>

                  <div className="grid gap-5 border-t border-slate-100 bg-slate-50/65 px-5 py-5 sm:px-6">
                    <LessonBlockForm action={updateLessonBlockAction.bind(null, lesson.id, block.id)} block={block} submitLabel="Save Block Changes" />
                    <form action={deleteLessonBlockAction.bind(null, lesson.id, block.id)}>
                      <ConfirmSubmitButton message="Delete this lesson block?" className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">
                        Delete Block
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <p className="font-semibold text-slate-700">No content blocks yet</p>
              <p className="mt-2 text-sm text-slate-500">Start with objectives, a heading, or a paragraph to shape this lesson.</p>
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
