"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { markLessonCompleteAction, updateLessonSectionProgressAction } from "@/app/learner/lessons/[id]/actions";

type Section = { id: string; label: string };

export function LessonReadingAids({
  lessonId,
  sections,
  initialLastSection,
  initialCompleted
}: {
  lessonId: string;
  sections: Section[];
  initialLastSection: string | null;
  initialCompleted: boolean;
}) {
  const [scrollPercent, setScrollPercent] = useState(0);
  const lastSavedSectionRef = useRef<string | null>(initialLastSection);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleScroll() {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
      setScrollPercent(scrollHeight > 0 ? Math.min(100, Math.round((scrollTop / scrollHeight) * 100)) : 0);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!mostVisible) return;

        const sectionId = mostVisible.target.id;
        if (!sectionId || sectionId === lastSavedSectionRef.current) return;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          lastSavedSectionRef.current = sectionId;
          updateLessonSectionProgressAction(lessonId, sectionId);
        }, 2000);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [lessonId, sections]);

  const resumeSection = initialLastSection ? sections.find((section) => section.id === initialLastSection) : null;

  return (
    <>
      <div
        role="progressbar"
        aria-label="Reading progress"
        aria-valuenow={scrollPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent"
      >
        <div className="h-full bg-teal-600 transition-[width] duration-150" style={{ width: `${scrollPercent}%` }} />
      </div>

      {sections.length ? (
        <details className="card mb-8 rounded-[1.5rem] p-5">
          <summary className="cursor-pointer list-none text-sm font-semibold text-teal-700 dark:text-amber-400">Table of contents</summary>
          <nav aria-label="Table of contents" className="mt-4 grid gap-2 sm:grid-cols-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-amber-400 hover:underline"
              >
                {section.label}
              </a>
            ))}
          </nav>
        </details>
      ) : null}

      {resumeSection && !initialCompleted ? (
        <div className="status-info mb-8 rounded-2xl border p-4 text-sm font-semibold">
          Continue where you left off —{" "}
          <a href={`#${resumeSection.id}`} className="underline underline-offset-2">
            {resumeSection.label}
          </a>
        </div>
      ) : null}
    </>
  );
}

export function LessonCompletionControl({ lessonId, initialCompleted }: { lessonId: string; initialCompleted: boolean }) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mt-12 flex flex-col items-start gap-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900/50 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">{completed ? "You've completed this lesson." : "Finished reading?"}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{completed ? "You can revisit it anytime." : "Mark it complete to track your progress."}</p>
      </div>
      <button
        type="button"
        disabled={completed || isPending}
        onClick={() => {
          setCompleted(true);
          startTransition(() => {
            markLessonCompleteAction(lessonId);
          });
        }}
        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-teal-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {completed ? "Completed ✓" : "Mark as Complete"}
      </button>
    </div>
  );
}
