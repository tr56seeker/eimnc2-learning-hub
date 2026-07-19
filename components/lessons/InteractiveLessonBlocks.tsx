"use client";

import { useState, useTransition } from "react";
import { saveLessonBlockProgressAction } from "@/app/learner/lessons/[id]/actions";

export function ActivityProgressToggle({
  blockId,
  lessonId,
  initialCompleted
}: {
  blockId: string;
  lessonId: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !completed;
    setCompleted(next);
    startTransition(async () => {
      await saveLessonBlockProgressAction(blockId, lessonId, next, null);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={
        completed
          ? "mt-5 ml-3 inline-flex rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm active:scale-[0.97] disabled:opacity-60 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400"
          : "mt-5 ml-3 inline-flex rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-teal-200 hover:text-teal-700 active:scale-[0.97] disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-amber-800 dark:hover:text-amber-400"
      }
    >
      {completed ? "Done ✓" : "Mark as Done"}
    </button>
  );
}

export function ChecklistProgress({
  blockId,
  lessonId,
  items,
  initialChecked
}: {
  blockId: string;
  lessonId: string;
  items: string[];
  initialChecked: boolean[];
}) {
  const [checked, setChecked] = useState<boolean[]>(
    initialChecked.length === items.length ? initialChecked : items.map(() => false)
  );
  const [, startTransition] = useTransition();

  function toggleItem(index: number) {
    const next = [...checked];
    next[index] = !next[index];
    setChecked(next);
    const completed = next.every(Boolean);
    startTransition(async () => {
      await saveLessonBlockProgressAction(blockId, lessonId, completed, { checked: next });
    });
  }

  return (
    <ul className="mt-5 grid gap-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>
          <button
            type="button"
            onClick={() => toggleItem(index)}
            className="flex w-full items-start gap-3 rounded-2xl bg-white/75 p-4 text-left text-sm leading-6 text-slate-700 shadow-sm transition hover:bg-white active:scale-[0.99] dark:bg-slate-900/75 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <span
              aria-hidden="true"
              className={
                checked[index]
                  ? "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-sky-500 bg-sky-500 text-xs font-bold text-white dark:border-sky-500 dark:bg-sky-500"
                  : "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-sky-300 bg-white dark:border-sky-700 dark:bg-slate-900"
              }
            >
              {checked[index] ? "✓" : ""}
            </span>
            <span className={checked[index] ? "line-through opacity-60" : ""}>{item}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function TextResponseBlock({
  blockId,
  lessonId,
  initialText,
  initialCompleted,
  placeholder,
  submitLabel,
  rows = 3
}: {
  blockId: string;
  lessonId: string;
  initialText: string;
  initialCompleted: boolean;
  placeholder: string;
  submitLabel: string;
  rows?: number;
}) {
  const [text, setText] = useState(initialText);
  const [saved, setSaved] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  function submit() {
    const completed = text.trim().length > 0;
    startTransition(async () => {
      await saveLessonBlockProgressAction(blockId, lessonId, completed, { text });
      setSaved(completed);
    });
  }

  return (
    <div className="mt-5">
      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setSaved(false);
        }}
        rows={rows}
        placeholder={placeholder}
        className="focus-ring w-full max-w-full resize-y rounded-2xl border border-slate-200/80 bg-white/85 p-4 font-normal leading-6 text-slate-800 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/85 dark:text-slate-200"
      />
      <button
        type="button"
        onClick={submit}
        disabled={isPending || !text.trim()}
        className={
          saved
            ? "mt-3 inline-flex rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm active:scale-[0.97] disabled:opacity-60 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400"
            : "mt-3 inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {saved ? "Saved ✓" : submitLabel}
      </button>
    </div>
  );
}
