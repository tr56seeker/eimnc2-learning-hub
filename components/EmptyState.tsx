export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300/80 bg-white/70 p-12 text-center shadow-sm shadow-slate-200/40 backdrop-blur">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-3 max-w-md leading-7 text-slate-500">{message}</p>
    </div>
  );
}
