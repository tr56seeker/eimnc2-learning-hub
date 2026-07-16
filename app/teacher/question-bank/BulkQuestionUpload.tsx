"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { bulkImportQuestionsAction, type BulkImportSummary } from "./actions";
import {
  BULK_QUESTION_COLUMNS,
  createBulkQuestionRow,
  validateBulkQuestionRows,
  type BulkQuestionColumn,
  type BulkQuestionRow
} from "./bulk-upload";
import type { QuestionBankItem } from "./QuestionBankClient";

type CompetencyOption = { id: string; code: string; title: string };

const initialSummary: BulkImportSummary | null = null;

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return String(value).trim();
  if ("text" in value && typeof value.text === "string") return value.text.trim();
  if ("result" in value) return cellText(value.result);
  if ("richText" in value && Array.isArray(value.richText)) {
    return value.richText.map((part) => part && typeof part === "object" && "text" in part ? String(part.text) : "").join("").trim();
  }
  return String(value).trim();
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error("The CSV file contains an unclosed quoted value.");

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function rowsFromGrid(grid: unknown[][]) {
  if (!grid.length) throw new Error("The file is empty.");
  const headers = grid[0].map((value) => cellText(value).toLowerCase().replace(/^\ufeff/, ""));
  const missingColumns = BULK_QUESTION_COLUMNS.filter((column) => !headers.includes(column));
  if (missingColumns.length) throw new Error(`Missing template column${missingColumns.length === 1 ? "" : "s"}: ${missingColumns.join(", ")}.`);

  const columnIndexes = new Map(headers.map((header, index) => [header, index]));
  return grid.slice(1).flatMap((values, index) => {
    const record: Partial<Record<BulkQuestionColumn, unknown>> = {};
    BULK_QUESTION_COLUMNS.forEach((column) => {
      record[column] = values[columnIndexes.get(column) ?? -1];
    });
    const row = createBulkQuestionRow(record, index + 2);
    const hasContent = BULK_QUESTION_COLUMNS.some((column) => row[column] !== "");
    return hasContent ? [row] : [];
  });
}

async function parseQuestionFile(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error("Choose a file smaller than 10 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") return rowsFromGrid(parseCsv(await file.text()));
  if (extension !== "xlsx") throw new Error("Choose an .xlsx or .csv file.");

  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("The workbook does not contain a worksheet.");

  const grid: unknown[][] = [];
  for (let rowNumber = 1; rowNumber <= worksheet.actualRowCount; rowNumber += 1) {
    const worksheetRow = worksheet.getRow(rowNumber);
    const values: unknown[] = [];
    for (let columnNumber = 1; columnNumber <= worksheet.actualColumnCount; columnNumber += 1) {
      values.push(worksheetRow.getCell(columnNumber).value);
    }
    grid.push(values);
  }
  return rowsFromGrid(grid);
}

async function downloadTemplate(competencies: CompetencyOption[]) {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  workbook.creator = "EIM NC II Learning Hub";
  workbook.created = new Date();
  workbook.title = "EIM Question Bank Bulk Upload Template";

  const worksheet = workbook.addWorksheet("Questions", {
    views: [{ state: "frozen", ySplit: 1 }]
  });
  const competencyCode = competencies.find((competency) => competency.code)?.code ?? "EIM12-T1-W04";
  worksheet.columns = [
    { header: "competency_code", key: "competency_code", width: 21 },
    { header: "question_type", key: "question_type", width: 21 },
    { header: "difficulty", key: "difficulty", width: 14 },
    { header: "question_text", key: "question_text", width: 52 },
    { header: "choice_a", key: "choice_a", width: 24 },
    { header: "choice_b", key: "choice_b", width: 24 },
    { header: "choice_c", key: "choice_c", width: 24 },
    { header: "choice_d", key: "choice_d", width: 24 },
    { header: "correct_answer", key: "correct_answer", width: 22 },
    { header: "points", key: "points", width: 11 },
    { header: "explanation", key: "explanation", width: 42 },
    { header: "is_active", key: "is_active", width: 13 }
  ];
  worksheet.addRows([
    {
      competency_code: competencyCode,
      question_type: "multiple_choice",
      difficulty: "easy",
      question_text: "Which PPE protects the eyes from flying particles?",
      choice_a: "Safety goggles",
      choice_b: "Bare hands",
      choice_c: "Wet cloth",
      choice_d: "Damaged gloves",
      correct_answer: "A",
      points: 1,
      explanation: "Safety goggles protect the eyes during electrical work.",
      is_active: "TRUE"
    },
    {
      competency_code: competencyCode,
      question_type: "true_false",
      difficulty: "easy",
      question_text: "A wet working area increases the risk of electric shock.",
      correct_answer: "TRUE",
      points: 1,
      explanation: "Water increases electrical shock risk.",
      is_active: "TRUE"
    },
    {
      competency_code: competencyCode,
      question_type: "identification",
      difficulty: "average",
      question_text: "What tool removes insulation without damaging the conductor?",
      correct_answer: "wire stripper",
      points: 1,
      explanation: "A wire stripper removes insulation cleanly.",
      is_active: "TRUE"
    },
    {
      competency_code: competencyCode,
      question_type: "essay",
      difficulty: "hots",
      question_text: "Explain how you would safely isolate and test an electrical circuit before repair.",
      points: 5,
      explanation: "Teacher notes: check isolation, verification, PPE, and safe work sequence.",
      is_active: "TRUE"
    }
  ]);
  worksheet.autoFilter = { from: "A1", to: "L5" };
  worksheet.getRow(1).height = 30;
  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: true };
  });
  for (let rowNumber = 2; rowNumber <= 1001; rowNumber += 1) {
    worksheet.getCell(`B${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"multiple_choice,true_false,identification,essay"']
    };
    worksheet.getCell(`C${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"easy,average,hots"']
    };
    worksheet.getCell(`L${rowNumber}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"TRUE,FALSE"']
    };
  }

  const competencyReference = workbook.addWorksheet("Competency Reference", {
    views: [{ state: "frozen", ySplit: 1 }]
  });
  competencyReference.columns = [
    { header: "competency_code", key: "code", width: 24 },
    { header: "competency_title", key: "title", width: 70 }
  ];
  competencyReference.addRows(
    competencies.length
      ? competencies.map((competency) => ({ code: competency.code, title: competency.title }))
      : [{ code: competencyCode, title: "Example competency code — replace with a code from the Learning Hub" }]
  );
  competencyReference.autoFilter = {
    from: "A1",
    to: `B${Math.max(2, competencies.length + 1)}`
  };
  competencyReference.getRow(1).height = 30;
  competencyReference.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });
  competencyReference.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
  });

  const instructions = workbook.addWorksheet("Instructions");
  instructions.columns = [{ width: 24 }, { width: 85 }];
  instructions.addRows([
    ["Column", "Rule"],
    ["competency_code", "Required. Must exactly match a competency code in the EIM Learning Hub."],
    ["question_type", "multiple_choice, true_false, identification, or essay"],
    ["difficulty", "easy, average, or hots"],
    ["question_text", "Required."],
    ["choice_a to choice_d", "Required for multiple_choice. Ignored for other types; True/False choices are generated automatically."],
    ["correct_answer", "Required except for essay. Multiple choice accepts A-D or exact answer text."],
    ["points", "Defaults to 1 when blank; otherwise enter a number greater than 0."],
    ["explanation", "Optional feedback, teacher notes, or rubric guidance."],
    ["is_active", "Optional TRUE/FALSE. Defaults to TRUE."],
    ["Import process", "Upload the completed file, review validation results, then choose Import Valid Questions."]
  ]);
  instructions.getRow(1).height = 30;
  instructions.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });
  instructions.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "eim-question-bank-bulk-upload-template.xlsx";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function StatusBadge({ status }: { status: "valid" | "error" | "duplicate" }) {
  const styles = status === "valid"
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
    : status === "duplicate"
      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
      : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300";
  const label = status === "valid" ? "Valid" : status === "duplicate" ? "Duplicate" : "Has Error";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{label}</span>;
}

export function BulkQuestionUpload({ competencies, existingQuestions }: {
  competencies: CompetencyOption[];
  existingQuestions: QuestionBankItem[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<BulkQuestionRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  const [summary, setSummary] = useState<BulkImportSummary | null>(initialSummary);
  const [isImporting, startImport] = useTransition();

  const validatedRows = useMemo(() => validateBulkQuestionRows(
    rows,
    competencies,
    existingQuestions.map((question) => ({
      competencyId: question.competencyId,
      questionText: question.questionText,
      questionType: question.questionType
    }))
  ), [competencies, existingQuestions, rows]);

  const counts = useMemo(() => ({
    valid: validatedRows.filter((row) => row.status === "valid").length,
    duplicate: validatedRows.filter((row) => row.status === "duplicate").length,
    error: validatedRows.filter((row) => row.status === "error").length
  }), [validatedRows]);
  const importableCount = counts.valid + (includeDuplicates ? counts.duplicate : 0);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setFileError("");
    setSummary(null);
    setIncludeDuplicates(false);
    try {
      const parsedRows = await parseQuestionFile(file);
      if (!parsedRows.length) throw new Error("The file does not contain any question rows.");
      if (parsedRows.length > 1000) throw new Error("A bulk upload can contain at most 1,000 rows.");
      setRows(parsedRows);
      setFileName(file.name);
    } catch (error) {
      setRows([]);
      setFileName("");
      setFileError(error instanceof Error ? error.message : "Unable to read this file.");
    } finally {
      setIsParsing(false);
    }
  };

  const importQuestions = () => {
    const formData = new FormData();
    formData.set("rows", JSON.stringify(rows));
    formData.set("include_duplicates", String(includeDuplicates));
    startImport(async () => {
      const result = await bulkImportQuestionsAction(formData);
      setSummary(result);
      if (result.ok) router.refresh();
    });
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-2xl border border-teal-100 bg-teal-50/60 p-5 sm:grid-cols-[1fr_auto] sm:items-center dark:border-amber-900/50 dark:bg-amber-950/40">
        <div>
          <h3 className="font-semibold text-teal-950 dark:text-amber-300">Start with the Excel template</h3>
          <p className="mt-1 text-sm leading-6 text-teal-800 dark:text-amber-400">Keep the header names unchanged. Uploading only creates a preview; nothing is saved until you confirm the import.</p>
        </div>
        <button
          type="button"
          disabled={isDownloading}
          onClick={async () => {
            setIsDownloading(true);
            setFileError("");
            try {
              await downloadTemplate(competencies);
            } catch {
              setFileError("Unable to create the Excel template. Please try again.");
            } finally {
              setIsDownloading(false);
            }
          }}
          className="min-h-11 rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 shadow-sm hover:bg-teal-50 disabled:opacity-60 dark:border-amber-800/50 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-amber-950/40"
        >
          {isDownloading ? "Preparing..." : "Download Excel Template"}
        </button>
      </div>

      <label className="grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-6 py-8 text-center hover:border-teal-300 hover:bg-teal-50/40 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-amber-700 dark:hover:bg-amber-950/30">
        <input type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" onChange={handleFile} className="sr-only" />
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7 text-slate-400 dark:text-slate-500"><path d="M12 16V4m0 0L8 8m4-4 4 4M5 15v4h14v-4" /></svg>
        <span className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">{isParsing ? "Reading file..." : fileName || "Choose an Excel or CSV file"}</span>
        <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">.xlsx preferred · .csv supported · maximum 1,000 rows / 10 MB</span>
      </label>

      {fileError ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{fileError}</div> : null}

      {summary ? (
        <div className={`rounded-2xl border p-5 ${summary.ok ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-950/40" : "border-red-200 bg-red-50/70 dark:border-red-900/50 dark:bg-red-950/30"}`}>
          <p className={`font-semibold ${summary.ok ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"}`}>{summary.message}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Total rows", summary.total],
              ["Imported", summary.imported],
              ["Skipped", summary.skipped],
              ["Errors", summary.errors]
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-white/80 px-3 py-2.5 dark:bg-slate-900/80">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-950 dark:text-slate-100">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {validatedRows.length ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-950 dark:text-slate-100">Import preview</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{counts.valid} valid · {counts.duplicate} duplicate · {counts.error} with errors</p>
            </div>
            {counts.duplicate ? (
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={includeDuplicates} onChange={(event) => setIncludeDuplicates(event.target.checked)} className="h-4 w-4 accent-teal-700" />
                Import duplicates too
              </label>
            ) : null}
          </div>

          <div className="max-h-[42vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[880px] border-collapse text-left text-xs">
              <thead className="sticky top-0 z-[1] bg-slate-50 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="border-b border-slate-200 px-3 py-3 dark:border-slate-700">Row</th>
                  <th className="w-[34%] border-b border-slate-200 px-3 py-3 dark:border-slate-700">Question</th>
                  <th className="border-b border-slate-200 px-3 py-3 dark:border-slate-700">Competency</th>
                  <th className="border-b border-slate-200 px-3 py-3 dark:border-slate-700">Type</th>
                  <th className="border-b border-slate-200 px-3 py-3 dark:border-slate-700">Status</th>
                  <th className="w-[30%] border-b border-slate-200 px-3 py-3 dark:border-slate-700">Validation</th>
                </tr>
              </thead>
              <tbody>
                {validatedRows.map((result) => (
                  <tr key={result.sourceRow} className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="border-b border-slate-100 px-3 py-3 font-semibold tabular-nums text-slate-500 dark:border-slate-800 dark:text-slate-400">{result.sourceRow}</td>
                    <td className="border-b border-slate-100 px-3 py-3 font-medium leading-5 text-slate-800 dark:border-slate-800 dark:text-slate-200">{result.row.question_text || "—"}</td>
                    <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-400">{result.row.competency_code || "—"}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-400">{result.row.question_type || "—"}</td>
                    <td className="border-b border-slate-100 px-3 py-3 dark:border-slate-800"><StatusBadge status={result.status} /></td>
                    <td className={`border-b border-slate-100 px-3 py-3 leading-5 dark:border-slate-800 ${result.status === "error" ? "text-red-700 dark:text-red-300" : result.status === "duplicate" ? "text-amber-700 dark:text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
                      {result.messages.length ? result.messages.join(" ") : "Ready to import."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Invalid rows are always skipped. Duplicate rows are skipped unless explicitly included.</p>
            <button
              type="button"
              disabled={!importableCount || isImporting}
              onClick={importQuestions}
              className="min-h-11 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isImporting ? "Importing..." : `Import Valid Questions (${importableCount})`}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
