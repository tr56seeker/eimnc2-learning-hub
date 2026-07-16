"use client";

import { useEffect, useRef, useState } from "react";
import { saveExamDraftAnswerAction } from "@/app/learner/exams/actions";

type Status = "idle" | "saving" | "saved" | "offline";

export function ExamAutosave({ attemptId, formId }: { attemptId: string; formId: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    async function flush(questionId: string, value: string) {
      setStatus("saving");
      try {
        const result = await saveExamDraftAnswerAction(attemptId, questionId, value);
        setStatus(result.ok ? "saved" : "offline");
        if (!result.ok) {
          window.setTimeout(() => void flush(questionId, value), 5000);
        }
      } catch {
        setStatus("offline");
        window.setTimeout(() => void flush(questionId, value), 5000);
      }
    }

    function scheduleSave(name: string, value: string) {
      const questionId = name.startsWith("q_") ? name.slice(2) : null;
      if (!questionId) return;

      const existingTimer = timersRef.current.get(questionId);
      if (existingTimer) clearTimeout(existingTimer);

      timersRef.current.set(
        questionId,
        setTimeout(() => void flush(questionId, value), 1200)
      );
    }

    function onInput(event: Event) {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
      if (target?.name) scheduleSave(target.name, target.value);
    }

    function onChange(event: Event) {
      const target = event.target as HTMLInputElement | null;
      if (target?.name && (target.type !== "radio" || target.checked)) {
        scheduleSave(target.name, target.value);
      }
    }

    form.addEventListener("input", onInput);
    form.addEventListener("change", onChange);

    const timers = timersRef.current;
    return () => {
      form.removeEventListener("input", onInput);
      form.removeEventListener("change", onChange);
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [attemptId, formId]);

  if (status === "idle") return null;

  const copy =
    status === "saving"
      ? "Saving your answers…"
      : status === "offline"
        ? "Connection interrupted — your answers are being preserved and will sync once you're back online."
        : "Answers saved.";

  return (
    <p
      role="status"
      className={
        status === "offline"
          ? "status-warning mb-4 rounded-xl border px-4 py-2 text-xs font-semibold"
          : "mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
      }
    >
      {copy}
    </p>
  );
}
