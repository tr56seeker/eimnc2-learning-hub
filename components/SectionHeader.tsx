export function SectionHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="mb-9 sm:mb-11">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-amber-400">{eyebrow}</p> : null}
      <h1 className="mt-2 max-w-5xl text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-5xl">{title}</h1>
      {description ? <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg">{description}</p> : null}
    </div>
  );
}
