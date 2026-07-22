import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { CompetencyOutline, type Topic } from "@/components/lessons/CompetencyOutline";
import { requireLearner } from "@/lib/auth";
import { type LessonBlock, type LessonBlockProgress } from "@/lib/lesson-blocks";
import { publishDueLessons } from "@/lib/lesson-scheduling";
import { firstRelation } from "@/lib/relations";

export default async function LearnerLessonsPage() {
  const { profile, supabase } = await requireLearner();

  await publishDueLessons();

  const [lessonsResult, progressResult] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, title, summary, content_md, estimated_minutes, competencies(id, code, title, order_index)")
      .eq("published", true)
      .order("order_index"),
    supabase.from("lesson_progress").select("lesson_id, completed").eq("learner_id", profile.id)
  ]);

  const lessons = lessonsResult.data ?? [];
  const lessonIds = lessons.map((lesson) => lesson.id);
  const completedLessonIds = new Set(
    (progressResult.data ?? []).filter((row) => row.completed).map((row) => row.lesson_id)
  );

  const [blocksResult, blockProgressResult, assignmentsResult, resourcesResult, examsResult] = lessonIds.length
    ? await Promise.all([
        supabase
          .from("lesson_blocks")
          .select("id, lesson_id, block_type, title, body, image_url, caption, alt_text, metadata, display_order, is_active, created_at, updated_at")
          .in("lesson_id", lessonIds)
          .eq("is_active", true)
          .order("display_order")
          .order("created_at")
          .returns<LessonBlock[]>(),
        supabase.from("lesson_block_progress").select("block_id, completed, response").eq("learner_id", profile.id),
        supabase
          .from("assignments")
          .select("id, lesson_id, title, instructions, due_at, submission_type")
          .in("lesson_id", lessonIds)
          .order("created_at"),
        supabase.from("lesson_resources").select("id, lesson_id, title, url, resource_type").in("lesson_id", lessonIds),
        supabase
          .from("exams")
          .select("id, lesson_id, title, duration_minutes, attempts_allowed")
          .in("lesson_id", lessonIds)
          .eq("status", "published")
          .order("created_at")
      ])
    : [{ data: [] as LessonBlock[] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const blocksByLesson = new Map<string, LessonBlock[]>();
  for (const block of blocksResult.data ?? []) {
    if (!blocksByLesson.has(block.lesson_id)) blocksByLesson.set(block.lesson_id, []);
    blocksByLesson.get(block.lesson_id)!.push(block);
  }

  const blockProgressByBlock: Record<string, LessonBlockProgress> = Object.fromEntries(
    (blockProgressResult.data ?? []).map((row) => [row.block_id, { blockId: row.block_id, completed: row.completed, response: row.response as LessonBlockProgress["response"] }])
  );

  const assignmentsByLesson = new Map<string, Topic["assignments"]>();
  for (const assignment of assignmentsResult.data ?? []) {
    if (!assignmentsByLesson.has(assignment.lesson_id)) assignmentsByLesson.set(assignment.lesson_id, []);
    assignmentsByLesson.get(assignment.lesson_id)!.push(assignment);
  }

  const resourcesByLesson = new Map<string, Topic["resources"]>();
  for (const resource of resourcesResult.data ?? []) {
    if (!resourcesByLesson.has(resource.lesson_id)) resourcesByLesson.set(resource.lesson_id, []);
    resourcesByLesson.get(resource.lesson_id)!.push(resource);
  }

  const examByLesson = new Map<string, Topic["exam"]>();
  for (const exam of examsResult.data ?? []) {
    if (!exam.lesson_id || examByLesson.has(exam.lesson_id)) continue;
    examByLesson.set(exam.lesson_id, {
      id: exam.id,
      title: exam.title,
      durationMinutes: exam.duration_minutes ?? 30,
      attemptsAllowed: exam.attempts_allowed ?? 1
    });
  }

  const groups = new Map<string, { code: string | null; title: string; orderIndex: number; topics: Topic[] }>();

  for (const lesson of lessons) {
    const competency = firstRelation(lesson.competencies);
    const key = competency?.id ?? "general";
    if (!groups.has(key)) {
      groups.set(key, {
        code: competency?.code ?? null,
        title: competency?.title ?? "General EIM Topics",
        orderIndex: competency?.order_index ?? 0,
        topics: []
      });
    }
    groups.get(key)!.topics.push({
      id: lesson.id,
      title: lesson.title,
      summary: lesson.summary,
      contentMd: lesson.content_md,
      estimatedMinutes: lesson.estimated_minutes ?? 30,
      completed: completedLessonIds.has(lesson.id),
      blocks: blocksByLesson.get(lesson.id) ?? [],
      blockProgress: blockProgressByBlock,
      assignments: assignmentsByLesson.get(lesson.id) ?? [],
      resources: resourcesByLesson.get(lesson.id) ?? [],
      exam: examByLesson.get(lesson.id) ?? null
    });
  }

  const orderedGroups = Array.from(groups.values()).sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Lessons" title="EIM Competency Lessons" description="Read the lessons before taking exams or submitting performance outputs." />

      {!orderedGroups.length ? (
        <EmptyState title="No lessons yet" message="Your teacher has not published lessons yet." />
      ) : (
        <div className="grid gap-16">
          {orderedGroups.map((group) => (
            <CompetencyOutline key={group.title} competencyCode={group.code} competencyTitle={group.title} topics={group.topics} />
          ))}
        </div>
      )}
    </PortalShell>
  );
}
