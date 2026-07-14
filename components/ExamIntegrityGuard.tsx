"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ViolationType = "tab_switch" | "copy_attempt" | "paste_attempt" | "right_click";

const VIOLATION_LABELS: Record<ViolationType, string> = {
  tab_switch: "switching away from the exam tab",
  copy_attempt: "copying exam content",
  paste_attempt: "pasting content into an answer",
  right_click: "right-click / context menu"
};

const FRIENDLY_LABELS: Record<ViolationType, string> = {
  tab_switch: "Switching tabs or apps during the exam",
  copy_attempt: "Attempting to copy exam content",
  paste_attempt: "Attempting to paste content into an answer",
  right_click: "Using right-click / context menu"
};

export function ExamIntegrityGuard({
  formId,
  maxViolations
}: {
  formId: string;
  maxViolations: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const [terminated, setTerminated] = useState(false);
  const logRef = useRef<string[]>([]);
  const friendlySetRef = useRef<Set<ViolationType>>(new Set());
  const terminatedRef = useRef(false);
  const countRef = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard client-mount detection so createPortal only runs after hydration
    setMounted(true);
  }, []);

  useEffect(() => {
    function forceSubmit(form: HTMLFormElement) {
      // Remove "required" so unanswered questions don't block native validation
      // from letting the forced auto-submit go through.
      form.querySelectorAll("[required]").forEach((el) => el.removeAttribute("required"));
      form.requestSubmit();
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

    function recordViolation(type: ViolationType) {
      if (terminatedRef.current) return;

      countRef.current += 1;
      logRef.current.push(`${VIOLATION_LABELS[type]} (violation #${countRef.current})`);
      friendlySetRef.current.add(type);

      if (countRef.current > maxViolations) {
        terminatedRef.current = true;
        setTerminated(true);
        setActiveWarning(
          `Violation limit reached (${maxViolations}). Your exam is being submitted automatically and your teacher has been notified.`
        );

        const form = document.getElementById(formId) as HTMLFormElement | null;
        if (form) {
          const summary = Array.from(friendlySetRef.current).map((t) => FRIENDLY_LABELS[t]).join("; ");
          setHiddenField(form, "violation_count", String(countRef.current));
          setHiddenField(
            form,
            "termination_reason",
            `Auto-submitted after exceeding ${maxViolations} allowed violations. Log: ${logRef.current.join("; ")}.`
          );
          setHiddenField(form, "termination_summary", summary);
          window.setTimeout(() => forceSubmit(form), 1200);
        }
      } else {
        setActiveWarning(
          `Warning ${countRef.current} of ${maxViolations}: ${VIOLATION_LABELS[type]} is not allowed during the exam. Exceeding ${maxViolations} will auto-submit your exam and notify your teacher.`
        );
      }
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

  if (!activeWarning || !mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-w-md rounded-[1.5rem] border border-red-200 bg-white p-6 text-center shadow-xl">
        <p className="text-4xl">⚠️</p>
        <h2 className="mt-3 text-lg font-semibold text-slate-950">Academic Integrity Warning</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{activeWarning}</p>
        {!terminated ? (
          <button
            type="button"
            onClick={() => setActiveWarning(null)}
            className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700"
          >
            I understand, continue exam
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById(formId) as HTMLFormElement | null;
              if (form) {
                form.querySelectorAll("[required]").forEach((el) => el.removeAttribute("required"));
                form.requestSubmit();
              } else {
                window.location.href = "/learner/exams";
              }
            }}
            className="mt-5 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            Exit exam now
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

