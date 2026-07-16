export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300/80 bg-white/70 p-12 text-center shadow-sm shadow-slate-200/40 backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/60 dark:shadow-black/20">
      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <p className="mx-auto mt-3 max-w-md leading-7 text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
