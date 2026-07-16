"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type ModalSize = "md" | "lg" | "xl";

const sizeClass: Record<ModalSize, string> = {
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-6xl"
};

export function Modal({
  title,
  description,
  children,
  onClose,
  size = "md"
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  size?: ModalSize;
}) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-[var(--radius-lg)] border border-white/80 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/40 ${sizeClass[size]}`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur sm:px-7 dark:border-slate-800 dark:bg-slate-900/95">
          <div>
            <h2 id={titleId} className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-2xl">
              {title}
            </h2>
            {description ? <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p> : null}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 text-xl leading-none text-slate-500 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            ×
          </button>
        </div>
        <div className="p-6 sm:p-7">{children}</div>
      </section>
    </div>
  );
}
