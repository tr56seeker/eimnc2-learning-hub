"use client";

import { useEffect, useRef, useState } from "react";

type ViolationType = "tab_switch" | "copy_attempt" | "paste_attempt" | "right_click";

const VIOLATION_LABELS: Record<ViolationType, string> = {
  tab_switch: "switching away from the exam tab",
  copy_attempt: "copying exam content",
  paste_attempt: "pasting content into an answer",
  right_click: "right-click / context menu"
};

export function ExamIntegrityGuard({
  formId,
  maxViolations
}: {
  formId: string;
  maxViolations: number;
}) {
  const [violationCount, setViolationCount] = useState(0);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const logRef = useRef<string[]>([]);
  const terminatedRef = useRef(false);
  const countRef = useRef(0);

  useEffect(() => {
    function recordViolation(type: ViolationType) {
      if (terminatedRef.current) return;

      countRef.current += 1;
      const label = VIOLATION_LABELS[type];
      logRef.current.push(`${label} (violation #${countRef.current})`);
      setViolationCount(countRef.current);

      if (countRef.current > maxViolations) {
        terminatedRef.current = true;
        setActiveWarning(
          `Violation limit reached (${maxViolations}). Your exam is being submitted automatically with your teacher notified.`
        );

        const form = document.getElementById(formId) as HTMLFormElement | null;
        if (form) {
          setHiddenField(form, "violation_count", String(countRef.current));
          setHiddenField(
            form,
            "termination_reason",
            `Auto-submitted after exceeding ${maxViolations} allowed violations. Log: ${logRef.current.join("; ")}.`
          );
          window.setTimeout(() => form.requestSubmit(), 1500);
        }
      } else {
        setActiveWarning(
          `Warning ${countRef.current} of ${maxViolations}: ${label} is not allowed during the exam. Exceeding ${maxViolations} will auto-submit your exam and notify your teacher.`
        );
      }
    }

    function setHiddenField(form: HTMLFormElement, name: string, value: string) {
      let input = form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        form.appendChild(input);
      }
      input.value = value;
    }

    function onVisibilityChange() {
      if (document.hidden) recordViolation("tab_switch");
    }

    function onCopy(event: ClipboardEvent) {
      event.preventDefault();
      recordViolation("copy_attempt");
    }

    function onCut(event: ClipboardEvent) {
      event.preventDefault();
      recordViolation("copy_attempt");
    }

    function onPaste(event: ClipboardEvent) {
      event.preventDefault();
      recordViolation("paste_attempt");
    }

    function onContextMenu(event: MouseEvent) {
      event.preventDefault();
      recordViolation("right_click");
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, [formId, maxViolations]);

  if (!activeWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-w-md rounded-[1.5rem] border border-red-200 bg-white p-6 text-center shadow-xl">
        <p className="text-4xl">⚠️</p>
        <h2 className="mt-3 text-lg font-semibold text-slate-950">Academic Integrity Warning</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{activeWarning}</p>
        {violationCount <= maxViolations ? (
          <button
            type="button"
            onClick={() => setActiveWarning(null)}
            className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700"
          >
            I understand, continue exam
          </button>
        ) : null}
      </div>
    </div>
  );
}
