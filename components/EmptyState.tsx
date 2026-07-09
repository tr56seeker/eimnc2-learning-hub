export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300/80 bg-white/60 p-10 text-center shadow-sm backdrop-blur">
      <p className="text-lg font-black text-slate-900">{title}</p>
      <p className="mx-auto mt-2 max-w-md leading-6 text-slate-500">{message}</p>
    </div>
  );
}
