import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { LessonBlockForm } from "@/components/lessons/LessonBlockForm";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { type LessonBlock, lessonBlockLabels } from "@/lib/lesson-blocks";
import { firstRelation } from "@/lib/relations";
import { createLessonBlockAction, deleteLessonBlockAction, updateLessonBlockAction } from "./actions";

type LessonRow = {
  id: string;
  title: string;
  summary: string | null;
  estimated_minutes: number | null;
  published: boolean;
  competencies: { code: string | null; title: string | null } | { code: string | null; title: string | null }[] | null;
};

export default async function LessonStudioPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, summary, estimated_minutes, published, competencies(code, title)")
    .eq("id", id)
    .single()
    .returns<LessonRow>();

  if (!lesson) notFound();

  const { data: blocks } = await supabase
    .from("lesson_blocks")
    .select("id, lesson_id, block_type, title, body, image_url, caption, alt_text, metadata, display_order, is_active, created_at, updated_at")
    .eq("lesson_id", id)
    .order("display_order")
    .order("created_at")
    .returns<LessonBlock[]>();

  const competency = firstRelation(lesson.competencies);
  const lessonBlocks = blocks ?? [];

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Lesson Studio" title={lesson.title} description="Build a modern learner-facing article using reusable content blocks." />

      <div className="mb-7 flex flex-wrap gap-3">
        <Link href="/teacher/lessons" className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
          Back to Lessons
        </Link>
        <Link href={`/learner/lessons/${lesson.id}`} className="rounded-2xl border border-teal-200 bg-white/70 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50">
          Preview as Learner
        </Link>
      </div>

      {query.message ? <div className="mb-7 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 font-semibold text-teal-800">{query.message}</div> : null}

      <div className="grid gap-8 xl:grid-cols-[0.82fr_1.18fr]">
        <aside className="grid gap-6">
          <section className="card rounded-[1.75rem] p-7 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{competency?.code ?? "EIM"}</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Lesson Info</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{lesson.summary ?? "No summary yet."}</p>
            <div className="mt-6 grid gap-2.5 text-sm text-slate-600">
              <p>Estimated time: {lesson.estimated_minutes ?? 45} minutes</p>
              <p>Status: {lesson.published ? "Published" : "Draft"}</p>
              <p>Blocks: {lessonBlocks.length}</p>
            </div>
          </section>

          <section className="card rounded-[1.75rem] p-7 sm:p-8">
            <h2 className="text-xl font-semibold text-slate-950">Add Content Block</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Use links for images, slides, videos, PDFs, and modules. Files are not uploaded here.</p>
            <div className="mt-7">
              <LessonBlockForm action={createLessonBlockAction.bind(null, lesson.id)} submitLabel="Add Block" />
            </div>
          </section>
        </aside>

        <section className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Content Blocks</h2>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
              {lessonBlocks.length} block{lessonBlocks.length === 1 ? "" : "s"}
            </span>
          </div>

          {lessonBlocks.map((block) => (
            <details key={block.id} className="card rounded-[1.5rem] p-5 sm:p-6">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                      {lessonBlockLabels[block.block_type]} / Order {block.display_order ?? 0}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">{block.title || block.caption || "Untitled block"}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{block.body || block.image_url || "No body content."}</p>
                  </div>
                  <span className={block.is_active === false ? "rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700" : "rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"}>
                    {block.is_active === false ? "Inactive" : "Active"}
                  </span>
                </div>
              </summary>

              <div className="mt-6 grid gap-6 border-t border-slate-100 pt-6">
                <LessonBlockForm action={updateLessonBlockAction.bind(null, lesson.id, block.id)} block={block} submitLabel="Save Block" />
                <form action={deleteLessonBlockAction.bind(null, lesson.id, block.id)}>
                  <ConfirmSubmitButton message="Delete this lesson block?" className="rounded-2xl border border-red-200 px-5 py-3 font-semibold text-red-700 hover:bg-red-50">
                    Delete Block
                  </ConfirmSubmitButton>
                </form>
              </div>
            </details>
          ))}

          {!lessonBlocks.length ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300/80 bg-white/70 p-10 text-center text-slate-500">
              No content blocks yet. Add a heading or paragraph to start shaping the lesson article.
            </div>
          ) : null}
        </section>
      </div>
    </PortalShell>
  );
}
