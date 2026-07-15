const PRIVACY_NOTICE =
  "For authorized school use only. Contains learner academic records — do not distribute outside Tabunoc National High School staff.";

export function ReportPrintHeader({
  title,
  scope,
  preparedBy
}: {
  title: string;
  scope?: string;
  preparedBy: string;
}) {
  const generatedOn = new Date().toLocaleString("en-PH", { dateStyle: "long", timeStyle: "short" });

  return (
    <div className="hidden print:block mb-6 border-b border-slate-300 pb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        EIM NC II Learning Hub — Tabunoc National High School
      </p>
      <h1 className="mt-1 text-xl font-semibold text-slate-950">{title}</h1>
      {scope ? <p className="mt-1 text-sm text-slate-600">Scope: {scope}</p> : null}
      <p className="mt-1 text-sm text-slate-600">
        Generated {generatedOn} by {preparedBy}
      </p>
      <p className="mt-2 text-xs text-slate-500">{PRIVACY_NOTICE}</p>
    </div>
  );
}
