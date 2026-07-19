"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { recordExamViolationAction, type ExamViolationType } from "@/app/learner/exams/actions";

type ViolationType = ExamViolationType;

const VIOLATION_LABELS: Record<ViolationType, string> = {
  tab_switch: "switching away from the exam tab",
  copy_attempt: "copying exam content",
  paste_attempt: "pasting content into an answer",
  right_click: "right-click / context menu",
  fullscreen_exit: "exiting fullscreen mode",
  devtools_attempt: "attempting to open developer tools",
  print_attempt: "attempting to print the exam",
  idle_timeout: "long period of no activity"
};

const FRIENDLY_LABELS: Record<ViolationType, string> = {
  tab_switch: "Switching tabs or apps during the exam",
  copy_attempt: "Attempting to copy exam content",
  paste_attempt: "Attempting to paste content into an answer",
  right_click: "Using right-click / context menu",
  fullscreen_exit: "Exiting fullscreen mode",
  devtools_attempt: "Attempting to open developer tools",
  print_attempt: "Attempting to print the exam",
  idle_timeout: "Long period of no activity on the exam"
};

const IDLE_LIMIT_MS = 90_000;

export function ExamIntegrityGuard({
  attemptId,
  formId,
  maxViolations
}: {
  attemptId: string;
  formId: string;
  maxViolations: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const [terminated, setTerminated] = useState(false);
  const friendlySetRef = useRef<Set<ViolationType>>(new Set());
  const terminatedRef = useRef(false);

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

    async function recordViolation(type: ViolationType) {
      if (terminatedRef.current) return;

      friendlySetRef.current.add(type);

      // The server persists the count against this attempt in real time and
      // is the sole source of truth for whether the threshold was
      // exceeded — the client only reflects what the server reports back.
      const result = await recordExamViolationAction(attemptId, type, maxViolations);

      if (terminatedRef.current) return;

      if (result.terminated) {
        terminatedRef.current = true;
        setTerminated(true);
        setActiveWarning(
          `Violation limit reached (${maxViolations}). Your exam is being submitted automatically and your teacher has been notified.`
        );

        const form = document.getElementById(formId) as HTMLFormElement | null;
        if (form) {
          const summary = Array.from(friendlySetRef.current).map((t) => FRIENDLY_LABELS[t]).join("; ");
          setHiddenField(form, "termination_summary", summary);
          window.setTimeout(() => forceSubmit(form), 1200);
        }
      } else {
        setActiveWarning(
          `Warning ${result.violationCount} of ${maxViolations}: ${VIOLATION_LABELS[type]} is not allowed during the exam. Exceeding ${maxViolations} will auto-submit your exam and notify your teacher.`
        );
      }
    }

    function onVisibilityChange() {
      if (document.hidden) void recordViolation("tab_switch");
    }

    // visibilitychange alone misses split-screen/multitasking (a tablet's Split
    // View, Windows Snap, etc.): the exam stays visually on screen and never
    // goes `hidden` even though the learner tapped into a different app to
    // search for answers. window blur/focus catch that, since they track input
    // focus rather than visibility. The delay avoids flagging brief, harmless
    // focus flicker (e.g. opening a <select>, a browser autofill popup), and
    // the document.hidden re-check skips the case where visibilitychange
    // already recorded this same departure, so one switch isn't double-counted.
    let blurTimer: ReturnType<typeof setTimeout> | null = null;
    function onWindowBlur() {
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        blurTimer = null;
        if (!document.hasFocus() && !document.hidden) void recordViolation("tab_switch");
      }, 400);
    }
    function onWindowFocus() {
      if (blurTimer) {
        clearTimeout(blurTimer);
        blurTimer = null;
      }
    }

    function onCopy(event: ClipboardEvent) {
      event.preventDefault();
      void recordViolation("copy_attempt");
    }

    function onCut(event: ClipboardEvent) {
      event.preventDefault();
      void recordViolation("copy_attempt");
    }

    function onPaste(event: ClipboardEvent) {
      event.preventDefault();
      void recordViolation("paste_attempt");
    }

    function onContextMenu(event: MouseEvent) {
      event.preventDefault();
      void recordViolation("right_click");
    }

    // Blocking the shortcut doesn't stop devtools opening via the browser's own
    // menu — there's no web API for that — but it closes off the common path
    // and, unlike right-click, a keyboard attempt is a clear enough signal to
    // log as its own violation rather than silently swallowing it.
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const ctrlOrCmd = event.ctrlKey || event.metaKey;

      const isDevtoolsShortcut =
        key === "f12" ||
        (ctrlOrCmd && event.shiftKey && ["i", "j", "c"].includes(key)) ||
        (ctrlOrCmd && key === "u");
      if (isDevtoolsShortcut) {
        event.preventDefault();
        void recordViolation("devtools_attempt");
        return;
      }

      if (ctrlOrCmd && key === "p") {
        event.preventDefault();
        void recordViolation("print_attempt");
      }
    }

    // Catches a cheating pattern the other checks all miss: the learner never
    // leaves the exam tab or window at all (so no blur/visibility/fullscreen
    // event fires), but stops interacting with it entirely — e.g. answering
    // from a phone or a printed copy sitting next to the screen. Paused
    // whenever the tab is hidden or unfocused, since those cases are already
    // reported more specifically by the handlers above; counting both would
    // just double-report the same absence.
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    function armIdleTimer() {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!document.hidden && document.hasFocus()) void recordViolation("idle_timeout");
      }, IDLE_LIMIT_MS);
    }
    function onActivity() {
      armIdleTimer();
    }

    // A native "leave site?" prompt — a deterrent against closing the tab to
    // search elsewhere, not a violation in itself (there's no reliable way to
    // tell a genuine accidental close from a deliberate one at this point, and
    // the browser's own dialog wording can't be customized).
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!attemptId || terminatedRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }

    // Only flags exiting fullscreen if the learner (or a school-configured
    // proctoring flow) had actually entered it — this guard never requests
    // fullscreen itself, so it's a no-op for exams taken in a normal window.
    let wasFullscreen = Boolean(document.fullscreenElement);
    function onFullscreenChange() {
      const isFullscreen = Boolean(document.fullscreenElement);
      if (wasFullscreen && !isFullscreen) {
        void recordViolation("fullscreen_exit");
      }
      wasFullscreen = isFullscreen;
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeunload", onBeforeUnload);

    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;
    activityEvents.forEach((name) => document.addEventListener(name, onActivity));
    armIdleTimer();

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeunload", onBeforeUnload);
      activityEvents.forEach((name) => document.removeEventListener(name, onActivity));
      if (blurTimer) clearTimeout(blurTimer);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [attemptId, formId, maxViolations]);

  if (!activeWarning || !mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-w-md rounded-[1.5rem] border border-red-200 bg-white p-6 text-center shadow-xl dark:border-red-900/50 dark:bg-slate-900">
        <p className="text-4xl">⚠️</p>
        <h2 className="mt-3 text-lg font-semibold text-slate-950 dark:text-slate-100">Academic Integrity Warning</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{activeWarning}</p>
        {!terminated ? (
          <button
            type="button"
            onClick={() => setActiveWarning(null)}
            className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700 active:scale-[0.97]"
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
            className="mt-5 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 active:scale-[0.97]"
          >
            Exit exam now
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

