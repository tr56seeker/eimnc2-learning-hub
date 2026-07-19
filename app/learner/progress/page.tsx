import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { ChecklistItem, ProgressMeter } from "@/components/lessons/TopicProgressMeter";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireLearner } from "@/lib/auth";
import { loadLessonTopicProgress } from "@/lib/lesson-topic-progress";

export default async function LearnerProgressPage() {
  const { profile, supabase } = await requireLearner();
  const topics = await loadLessonTopicProgress(supabase, profile.id);

  const overallPercent = topics.length ? Math.round(topics.reduce((sum, topic) => sum + topic.percentComplete, 0) / topics.length) : 0;
  const completedTopics = topics.filter((topic) => topic.percentComplete === 100).length;

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Learner" title="My Progress" description="Reading, activities, output submissions, and quiz scores for every topic, in one place." />

      {!topics.length ? (
        <EmptyState title="No published lessons yet" message="Your progress will appear here once your teacher publishes lessons." />
      ) : (
        <>
          <section className="card rounded-[1.75rem] p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overall completion</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{overallPercent}%</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{completedTopics} of {topics.length} topics fully complete</p>
              </div>
              <div className="w-full max-w-sm sm:w-64">
                <ProgressMeter percent={overallPercent} />
              </div>
            </div>
          </section>

          <div className="mt-7 grid gap-5">
            {topics.map((topic) => (
              <section key={topic.lessonId} className="card rounded-[1.75rem] p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-amber-400">{topic.competencyCode ?? "EIM"}</p>
                    <Link href={`/learner/lessons/${topic.lessonId}`} className="mt-1 block text-xl font-semibold text-slate-950 hover:text-teal-700 active:scale-[0.99] dark:text-slate-100 dark:hover:text-amber-400">
                      {topic.lessonTitle}
                    </Link>
                  </div>
                  <div className="w-full max-w-xs sm:w-56">
                    <ProgressMeter percent={topic.percentComplete} />
                  </div>
                </div>

                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  <ChecklistItem done={topic.read} label="Finished reading" />
                  <ChecklistItem
                    done={topic.activity !== null && topic.activity.total > 0 && topic.activity.completed === topic.activity.total}
                    label={topic.activity ? `Activities (${topic.activity.completed}/${topic.activity.total})` : "No activity in this topic"}
                  />
                  <ChecklistItem
                    done={topic.output !== null && topic.output.status !== "not_submitted"}
                    label={topic.output ? "Submitted output" : "No output required"}
                  />
                  <ChecklistItem
                    done={topic.assessment !== null && topic.assessment.attempted}
                    label={
                      topic.assessment
                        ? topic.assessment.attempted
                          ? `Assessment: ${topic.assessment.score ?? 0}/${topic.assessment.maxScore ?? 0}`
                          : "Assessment not yet taken"
                        : "No assessment for this topic"
                    }
                  />
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </PortalShell>
  );
}
