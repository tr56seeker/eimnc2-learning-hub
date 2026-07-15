"use client";

import { toCsv, type CsvColumn, type CsvRow } from "@/lib/csv";

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ReportToolbar({
  filename,
  columns,
  rows
}: {
  filename: string;
  columns: CsvColumn[];
  rows: CsvRow[];
}) {
  return (
    <div className="print:hidden flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => triggerDownload(toCsv(columns, rows), filename)}
        className="rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
      >
        Export CSV
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
      >
        Print Report
      </button>
    </div>
  );
}
