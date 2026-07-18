"use client";

export function GradebookPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:border-teal-200 hover:text-teal-700 active:scale-[0.97] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-amber-800 dark:hover:text-amber-400"
    >
      Print
    </button>
  );
}
