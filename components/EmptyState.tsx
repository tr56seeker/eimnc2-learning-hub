export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
      <p className="text-lg font-black text-slate-800">{title}</p>
      <p className="mt-2 text-slate-500">{message}</p>
    </div>
  );
}
