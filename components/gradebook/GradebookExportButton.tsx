"use client";

import { useState } from "react";
import type { TermSummaryRow } from "@/lib/gradebook";

type DetailAssessmentColumn = {
  id: string;
  category: "written" | "performance" | "summative" | "term_exam";
  label: string;
  highestPossible: number | null;
};

type DetailExportRow = {
  rowNumber: number;
  lrn: string | null;
  fullName: string;
  scores: Record<string, number | null>;
  writtenPS: number | null;
  writtenWS: number | null;
  performancePS: number | null;
  performanceWS: number | null;
  examPS: number | null;
  examWS: number | null;
  initialGrade: number | null;
  transmutedGrade: number | null;
};

function roundOrBlank(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  return Number(Number(value).toFixed(digits));
}

async function exportSummary(rows: TermSummaryRow[], sectionLabel: string) {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  workbook.creator = "EIM NC II Learning Hub";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Term Summary", { views: [{ state: "frozen", ySplit: 2 }] });
  worksheet.mergeCells("A1:H1");
  worksheet.getCell("A1").value = `EIM NC II Gradebook Summary — ${sectionLabel}`;
  worksheet.getCell("A1").font = { bold: true, size: 13 };

  worksheet.columns = [
    { header: "No.", key: "rowNumber", width: 6 },
    { header: "LRN", key: "lrn", width: 16 },
    { header: "Learner Name", key: "fullName", width: 32 },
    { header: "First Term", key: "firstTerm", width: 12 },
    { header: "Second Term", key: "secondTerm", width: 13 },
    { header: "Third Term", key: "thirdTerm", width: 12 },
    { header: "Average", key: "average", width: 11 },
    { header: "Remarks", key: "remarks", width: 12 }
  ];
  worksheet.getRow(2).values = worksheet.columns.map((column) => String(column.header ?? ""));
  worksheet.getRow(2).font = { bold: true };
  worksheet.spliceRows(1, 0);

  rows.forEach((row) => {
    worksheet.addRow({
      rowNumber: row.rowNumber,
      lrn: row.lrn ?? "",
      fullName: row.fullName,
      firstTerm: roundOrBlank(row.firstTerm),
      secondTerm: roundOrBlank(row.secondTerm),
      thirdTerm: roundOrBlank(row.thirdTerm),
      average: roundOrBlank(row.average),
      remarks: row.remarks ?? ""
    });
  });

  return workbook;
}

async function exportDetail(
  rows: DetailExportRow[],
  columns: DetailAssessmentColumn[],
  sectionLabel: string,
  term: string
) {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  workbook.creator = "EIM NC II Learning Hub";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Class Record", { views: [{ state: "frozen", xSplit: 3, ySplit: 3 }] });

  const categoryLabel = { written: "Written / Oral Work", performance: "Performance Task", summative: "Summative", term_exam: "Term Exam" } as const;

  const staticHeaders = ["No.", "LRN", "Learner Name"];
  const assessmentHeaders = columns.map((column) => `${categoryLabel[column.category]} ${column.label}${column.highestPossible ? ` (${column.highestPossible})` : ""}`);
  const tailHeaders = ["Written PS%", "Written WS", "Performance PS%", "Performance WS", "Exam PS%", "Exam WS", "Initial Grade", "Transmuted Grade"];

  worksheet.mergeCells(1, 1, 1, staticHeaders.length + assessmentHeaders.length + tailHeaders.length);
  worksheet.getCell(1, 1).value = `EIM NC II Class Record — ${sectionLabel} — ${term}`;
  worksheet.getCell(1, 1).font = { bold: true, size: 13 };

  const headerRow = worksheet.getRow(2);
  [...staticHeaders, ...assessmentHeaders, ...tailHeaders].forEach((label, index) => {
    headerRow.getCell(index + 1).value = label;
    headerRow.getCell(index + 1).font = { bold: true };
  });

  worksheet.columns.forEach((column, index) => {
    if (!column) return;
    column.width = index < staticHeaders.length ? [6, 16, 32][index] : 14;
  });

  rows.forEach((row) => {
    const rowValues = [
      row.rowNumber,
      row.lrn ?? "",
      row.fullName,
      ...columns.map((column) => (row.scores[column.id] ?? "")),
      roundOrBlank(row.writtenPS),
      roundOrBlank(row.writtenWS),
      roundOrBlank(row.performancePS),
      roundOrBlank(row.performanceWS),
      roundOrBlank(row.examPS),
      roundOrBlank(row.examWS),
      roundOrBlank(row.initialGrade),
      roundOrBlank(row.transmutedGrade)
    ];
    worksheet.addRow(rowValues);
  });

  return workbook;
}

async function triggerDownload(workbook: Awaited<ReturnType<typeof exportSummary>>, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function GradebookExportButton({
  view,
  term,
  sectionLabel,
  summaryRows,
  detailRows,
  detailColumns
}: {
  view: "summary" | "detail";
  term: string;
  sectionLabel: string;
  summaryRows: TermSummaryRow[];
  detailRows: DetailExportRow[];
  detailColumns: DetailAssessmentColumn[];
}) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const safeSection = sectionLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      const safeTerm = term.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

      if (view === "summary") {
        const workbook = await exportSummary(summaryRows, sectionLabel);
        await triggerDownload(workbook, `gradebook-summary-${safeSection}.xlsx`);
      } else {
        const workbook = await exportDetail(detailRows, detailColumns, sectionLabel, term);
        await triggerDownload(workbook, `gradebook-detail-${safeSection}-${safeTerm}.xlsx`);
      }
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className="rounded-2xl border border-teal-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-teal-700 shadow-sm hover:bg-teal-50 active:scale-[0.97] disabled:opacity-60 dark:border-amber-800 dark:bg-slate-900/80 dark:text-amber-400 dark:hover:bg-amber-950/40"
    >
      {isExporting ? "Preparing file..." : "Export to Excel"}
    </button>
  );
}
