import Link from "next/link";

export type AttentionRow = {
  label: string;
  value: number;
  href: string;
  tone: "rose" | "amber" | "slate";
};

const toneClasses: Record<AttentionRow["tone"], string> = {
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
};

export function AttentionCard({ title, rows }: { title: string; rows: AttentionRow[] }) {
  return (
    <div className="card rounded-[1.5rem] p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{title}</h2>
      <div className="mt-4 grid gap-1">
        {rows.map((row) => (
          <Link
            key={row.href}
            href={row.href}
            className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.label}</span>
            <span className={`min-w-8 rounded-full px-2.5 py-1 text-center text-xs font-bold ${row.value > 0 ? toneClasses[row.tone] : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"}`}>
              {row.value}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
