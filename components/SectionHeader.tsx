export function SectionHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="mb-6">
      {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.25em] text-teal-700">{eyebrow}</p> : null}
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
      {description ? <p className="mt-3 max-w-3xl text-slate-600">{description}</p> : null}
    </div>
  );
}
