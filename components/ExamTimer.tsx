"use client";

import { useEffect, useRef, useState } from "react";

export function ExamTimer({ deadlineIso, formId }: { deadlineIso: string; formId: string }) {
  const [remainingMs, setRemainingMs] = useState(() => new Date(deadlineIso).getTime() - Date.now());
  const hasAutoSubmitted = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(deadlineIso).getTime() - Date.now();
      setRemainingMs(diff);

      if (diff <= 0 && !hasAutoSubmitted.current) {
        hasAutoSubmitted.current = true;
        const form = document.getElementById(formId) as HTMLFormElement | null;
        form?.requestSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineIso, formId]);

  const clampedMs = Math.max(0, remainingMs);
  const totalSeconds = Math.floor(clampedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isLow = totalSeconds <= 300;
  const isCritical = totalSeconds <= 60;

  return (
    <div
      role="timer"
      aria-live="polite"
      className={`sticky top-4 z-20 mb-4 ml-auto flex w-fit items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold shadow-sm shadow-slate-200/60 ${
        isCritical
          ? "animate-pulse border-red-300 bg-red-50 text-red-700"
          : isLow
            ? "border-amber-300 bg-amber-50 text-amber-800"
            : "border-teal-200 bg-teal-50 text-teal-800"
      }`}
    >
      <span aria-hidden="true">⏱</span>
      <span>
        {totalSeconds > 0
          ? `${minutes}:${seconds.toString().padStart(2, "0")} remaining`
          : "Time's up — submitting..."}
      </span>
    </div>
  );
}
