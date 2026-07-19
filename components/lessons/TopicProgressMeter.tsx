export function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span
        aria-hidden="true"
        className={
          done
            ? "grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-[11px] font-bold text-white"
            : "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-slate-300 dark:border-slate-600"
        }
      >
        {done ? "✓" : ""}
      </span>
      <span className={done ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}>{label}</span>
    </li>
  );
}

export function ProgressMeter({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 w-full min-w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" title={`${percent}% complete`}>
        <div className="h-full rounded-full bg-teal-600 transition-[width] dark:bg-amber-500" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-400">{percent}%</span>
    </div>
  );
}
