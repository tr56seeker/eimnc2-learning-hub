"use client";

import { useState } from "react";
import { LessonContentSections, type LessonAssignment, type LessonExamSummary, type LessonResource } from "@/components/lessons/LessonContentSections";
import { type LessonBlock, type LessonBlockProgress } from "@/lib/lesson-blocks";

export type Topic = {
  id: string;
  title: string;
  summary: string | null;
  contentMd: string | null;
  estimatedMinutes: number;
  completed: boolean;
  blocks: LessonBlock[];
  blockProgress: Record<string, LessonBlockProgress>;
  assignments: LessonAssignment[];
  resources: LessonResource[];
  exam: LessonExamSummary | null;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CompetencyOutline({
  competencyCode,
  competencyTitle,
  topics
}: {
  competencyCode: string | null;
  competencyTitle: string;
  topics: Topic[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = topics[activeIndex];

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-amber-400">
        {competencyCode ?? "EIM"} / The Competency
      </p>
      <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-slate-100">
        {competencyTitle}
      </h2>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-0">
        <ol className="grid content-start gap-1 border-l border-slate-200 lg:sticky lg:top-24 lg:self-start dark:border-slate-800">
          {topics.map((topic, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={topic.id}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`-ml-px flex w-full items-start gap-4 border-l-2 px-5 py-3.5 text-left transition active:scale-[0.99] ${
                    isActive
                      ? "border-teal-700 dark:border-amber-400"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <span
                    className={`mt-0.5 text-sm font-semibold tabular-nums ${
                      isActive ? "text-teal-700 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {pad(index + 1)}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block font-semibold ${
                        isActive ? "text-slate-950 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {topic.title}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-slate-500 dark:text-slate-400">
                      {topic.completed ? "Completed" : `${topic.estimatedMinutes} minutes`}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {active ? (
          <div key={active.id} className="min-w-0 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:border-l lg:border-slate-200 lg:pl-10 dark:lg:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {pad(activeIndex + 1)} — {competencyCode ?? "EIM"}
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-3xl">{active.title}</h3>
            {active.summary ? <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{active.summary}</p> : null}

            <div className="mt-8">
              <LessonContentSections
                lessonId={active.id}
                blocks={active.blocks}
                progressByBlock={active.blockProgress}
                assignments={active.assignments}
                resources={active.resources}
                exam={active.exam}
                interactive
                legacyContentMd={active.contentMd}
                completed={active.completed}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
