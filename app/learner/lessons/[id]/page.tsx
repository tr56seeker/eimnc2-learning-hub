import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonContentSections, moduleGroups, slugify } from "@/components/lessons/LessonContentSections";
import { LessonReadingAids } from "@/components/lessons/LessonProgressTracker";
import { PortalShell } from "@/components/PortalShell";
import { getCurrentUserAndProfile, requireActiveAccount } from "@/lib/auth";
import { type LessonBlock, type LessonBlockProgress } from "@/lib/lesson-blocks";
import { publishDueLessons } from "@/lib/lesson-scheduling";
import { firstRelation } from "@/lib/relations";

type LessonRow = {
  id: string;
  title: string;
  summary: string | null;
  content_md: string | null;
  estimated_minutes: number | null;
  published: boolean;
  competencies: { code: string | null; title: string | null } | { code: string | null; title: string | null }[] | null;
};

type AssignmentRow = {
  id: string;
  title: string;
  instructions: string | null;
  due_at: string | null;
  submission_type: string;
};

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, supabase } = await getCurrentUserAndProfile();
  if (profile.role === "learner") {
    requireActiveAccount(profile);
  }

  const isTeacherPreview = profile.role === "teacher" || profile.role === "admin";

  await publishDueLessons();

  let lessonQuery = supabase
    .from("lessons")
    .select("id, title, summary, content_md, estimated_minutes, published, competencies(code, title)")
    .eq("id", id);

  if (!isTeacherPreview) {
    lessonQuery = lessonQuery.eq("published", true);
  }

  const { data: lesson } = await lessonQuery.single().returns<LessonRow>();

  if (!lesson) notFound();

  const competency = firstRelation(lesson.competencies);

  const [blocksResult, resourcesResult, assignmentsResult, examResult] = await Promise.all([
    supabase
      .from("lesson_blocks")
      .select("id, lesson_id, block_type, title, body, image_url, caption, alt_text, metadata, display_order, is_active, created_at, updated_at")
      .eq("lesson_id", id)
      .eq("is_active", true)
      .order("display_order")
      .order("created_at")
      .returns<LessonBlock[]>(),
    supabase
      .from("lesson_resources")
      .select("id, title, url, resource_type")
      .eq("lesson_id", id),
    supabase
      .from("assignments")
      .select("id, title, instructions, due_at, submission_type")
      .eq("lesson_id", id)
      .order("created_at")
      .returns<AssignmentRow[]>(),
    supabase
      .from("exams")
      .select("id, title, duration_minutes, attempts_allowed")
      .eq("lesson_id", id)
      .eq("status", "published")
      .order("created_at")
      .limit(1)
      .maybeSingle()
  ]);

  const blocks = blocksResult.data ?? [];
  const resources = resourcesResult.data ?? [];
  const assignments = assignmentsResult.data ?? [];
  const examRow = examResult.data;
  const exam = examRow
    ? { id: examRow.id, title: examRow.title, durationMinutes: examRow.duration_minutes ?? 30, attemptsAllowed: examRow.attempts_allowed ?? 1 }
    : null;
  const reflectionBlocks = blocks.filter((block) => block.block_type === "reflection");
  const resourceBlocks = blocks.filter((block) => block.block_type === "resources" || block.block_type === "references");
  const groupedTypes = new Set([
    ...moduleGroups.flatMap((group) => group.types),
    "reflection",
    "resources",
    "references"
  ]);
  const legacyBlocks = blocks.filter((block) => !groupedTypes.has(block.block_type));

  const [{ data: progress }, { data: blockProgressRows }] = !isTeacherPreview
    ? await Promise.all([
        supabase.from("lesson_progress").select("completed, last_section").eq("lesson_id", id).eq("learner_id", profile.id).maybeSingle(),
        supabase.from("lesson_block_progress").select("block_id, completed, response").eq("lesson_id", id).eq("learner_id", profile.id)
      ])
    : [{ data: null }, { data: null }];

  const progressByBlock: Record<string, LessonBlockProgress> = Object.fromEntries(
    (blockProgressRows ?? []).map((row) => [row.block_id, { blockId: row.block_id, completed: row.completed, response: row.response as LessonBlockProgress["response"] }])
  );

  const readerSections: { id: string; label: string }[] = [];
  if (blocks.length) {
    for (const group of moduleGroups) {
      const sectionBlocks = blocks.filter((block) => group.types.includes(block.block_type));
      if (sectionBlocks.length) readerSections.push({ id: slugify(group.title), label: group.title });
    }
    if (legacyBlocks.length) readerSections.push({ id: slugify("Additional Lesson Content"), label: "Additional Lesson Content" });
  } else {
    readerSections.push({ id: slugify("Explore the Lesson"), label: "Explore the Lesson" });
  }
  if (assignments.length) readerSections.push({ id: slugify("Performance Task"), label: "Performance Task" });
  if (exam) readerSections.push({ id: slugify("Quiz"), label: "Quiz" });
  if (reflectionBlocks.length) readerSections.push({ id: slugify("Reflection"), label: "Reflection" });
  if (resources.length || resourceBlocks.length) readerSections.push({ id: slugify("Resources"), label: "Resources" });

  return (
    <PortalShell profile={profile}>
      <article className="mx-auto max-w-6xl">
        <header className="rounded-3xl border border-white/80 dark:border-slate-800/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,253,250,0.88)_48%,rgba(239,246,255,0.86))] dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(74,36,16,0.88)_48%,rgba(15,23,42,0.86))] p-7 shadow-xl shadow-slate-200/50 dark:shadow-black/30 sm:p-10">
          <Link href={isTeacherPreview ? `/teacher/lessons/${id}/studio` : "/learner/lessons"} className="text-sm font-semibold text-teal-700 dark:text-amber-400 hover:text-teal-800 dark:hover:text-amber-300 active:scale-[0.97]">
            {isTeacherPreview ? "Back to Studio" : "Back to lessons"}
          </Link>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full border border-teal-200 dark:border-amber-800/50 bg-teal-50 dark:bg-amber-950/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-amber-400">
              {competency?.code ?? "EIM"}
            </span>
            {isTeacherPreview ? (
              <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                Teacher Preview / {lesson.published ? "Published" : "Draft"}
              </span>
            ) : null}
            {progress?.completed ? (
              <span className="rounded-full border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Completed ✓
              </span>
            ) : null}
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-6xl">{lesson.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400">{lesson.summary}</p>
          <p className="mt-6 text-sm font-medium text-slate-500 dark:text-slate-400">{lesson.estimated_minutes ?? 45} minute lesson</p>
        </header>

        {!isTeacherPreview ? (
          <div className="mt-8">
            <LessonReadingAids
              lessonId={id}
              sections={readerSections}
              initialLastSection={progress?.last_section ?? null}
              initialCompleted={progress?.completed ?? false}
            />
          </div>
        ) : null}

        <LessonContentSections
          lessonId={id}
          blocks={blocks}
          progressByBlock={progressByBlock}
          assignments={assignments}
          resources={resources}
          exam={exam}
          interactive={!isTeacherPreview}
          legacyContentMd={lesson.content_md}
          completed={progress?.completed ?? false}
        />
      </article>
    </PortalShell>
  );
}
