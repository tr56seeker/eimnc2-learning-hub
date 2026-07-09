export function StatCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <div className="card rounded-[1.5rem] p-6">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{value}</p>
      {helper ? <p className="mt-3 text-sm leading-6 text-slate-500">{helper}</p> : null}
    </div>
  );
}
