import Link from "next/link";

export type QuickLink = {
  label: string;
  href: string;
  glyph: string;
  tone: "teal" | "indigo" | "amber" | "rose" | "slate" | "violet";
};

const toneClasses: Record<QuickLink["tone"], string> = {
  teal: "bg-teal-50 text-teal-700 dark:bg-amber-950/40 dark:text-amber-300",
  indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
};

export function QuickLinkGrid({ links }: { links: QuickLink[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="group flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-3.5 shadow-sm shadow-slate-200/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:border-teal-200 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-black/20 dark:hover:border-amber-700"
        >
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${toneClasses[link.tone]}`}>
            {link.glyph}
          </span>
          <span className="text-sm font-semibold text-slate-800 group-hover:text-teal-700 dark:text-slate-200 dark:group-hover:text-amber-300">{link.label}</span>
        </Link>
      ))}
    </div>
  );
}
