"use client";

import { useState } from "react";
import {
  DEPED_SCHOOL_INFO,
  DEPED_SUBJECT_INFO,
  type DepedExportPayload,
  type DepedTermData
} from "@/lib/deped-export";

const MAX_PER_SEX = 50;

function writeRowScores(
  worksheet: import("exceljs").Worksheet,
  row: number,
  scores: { written: (number | null)[]; performance: (number | null)[]; sa1: number | null; sa2: number | null; te: number | null }
) {
  scores.written.forEach((value, index) => {
    if (value !== null) worksheet.getCell(row, 6 + index).value = value; // F=6..J=10
  });
  scores.performance.forEach((value, index) => {
    if (value !== null) worksheet.getCell(row, 14 + index).value = value; // N=14..P=16
  });
  if (scores.sa1 !== null) worksheet.getCell(row, 20).value = scores.sa1; // T
  if (scores.sa2 !== null) worksheet.getCell(row, 21).value = scores.sa2; // U
  if (scores.te !== null) worksheet.getCell(row, 22).value = scores.te; // V
}

function fillTermSheet(
  worksheet: import("exceljs").Worksheet,
  termData: DepedTermData,
  maleLearnerIds: string[],
  femaleLearnerIds: string[]
) {
  termData.writtenHPS.forEach((value, index) => {
    if (value !== null) worksheet.getCell(11, 6 + index).value = value;
  });
  termData.performanceHPS.forEach((value, index) => {
    if (value !== null) worksheet.getCell(11, 14 + index).value = value;
  });
  if (termData.sa1HPS !== null) worksheet.getCell(11, 20).value = termData.sa1HPS;
  if (termData.sa2HPS !== null) worksheet.getCell(11, 21).value = termData.sa2HPS;
  if (termData.teHPS !== null) worksheet.getCell(11, 22).value = termData.teHPS;

  maleLearnerIds.slice(0, MAX_PER_SEX).forEach((learnerId, index) => {
    const scores = termData.scoresByLearner[learnerId];
    if (scores) writeRowScores(worksheet, 13 + index, scores);
  });

  femaleLearnerIds.slice(0, MAX_PER_SEX).forEach((learnerId, index) => {
    const scores = termData.scoresByLearner[learnerId];
    if (scores) writeRowScores(worksheet, 64 + index, scores);
  });
}

export function DepedClassRecordExportButton({ payload }: { payload: DepedExportPayload }) {
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const maleLearners = payload.learners.filter((learner) => learner.sex === "Male");
  const femaleLearners = payload.learners.filter((learner) => learner.sex === "Female");
  const unassignedCount = payload.learners.length - maleLearners.length - femaleLearners.length;
  const truncated = maleLearners.length > MAX_PER_SEX || femaleLearners.length > MAX_PER_SEX;

  async function handleExport() {
    setStatus("working");
    setErrorMessage(null);
    try {
      const response = await fetch("/templates/eim-eclass-record-master.xlsx");
      if (!response.ok) throw new Error("Could not load the DepEd template file.");
      const templateBuffer = await response.arrayBuffer();

      const { Workbook } = await import("exceljs");
      const workbook = new Workbook();
      await workbook.xlsx.load(templateBuffer);

      const inputData = workbook.getWorksheet("INPUT DATA");
      if (!inputData) throw new Error("Template is missing the INPUT DATA sheet.");

      inputData.getCell("F10").value = DEPED_SCHOOL_INFO.region;
      inputData.getCell("F11").value = DEPED_SCHOOL_INFO.division;
      inputData.getCell("F13").value = DEPED_SCHOOL_INFO.schoolId;
      inputData.getCell("F14").value = DEPED_SCHOOL_INFO.schoolName;
      inputData.getCell("F16").value = payload.schoolYear;
      inputData.getCell("F22").value = payload.teacherName;
      inputData.getCell("F23").value = DEPED_SUBJECT_INFO.track;
      inputData.getCell("F24").value = payload.gradeLevel;
      inputData.getCell("F25").value = payload.section;
      inputData.getCell("F26").value = DEPED_SUBJECT_INFO.subjectType;
      inputData.getCell("F28").value = DEPED_SUBJECT_INFO.subject;

      maleLearners.slice(0, MAX_PER_SEX).forEach((learner, index) => {
        inputData.getCell(11 + index, 11).value = index + 1; // K
        inputData.getCell(11 + index, 12).value = learner.fullName; // L
      });
      femaleLearners.slice(0, MAX_PER_SEX).forEach((learner, index) => {
        inputData.getCell(11 + index, 14).value = index + 1; // N
        inputData.getCell(11 + index, 15).value = learner.fullName; // O
      });

      const maleIds = maleLearners.map((learner) => learner.id);
      const femaleIds = femaleLearners.map((learner) => learner.id);

      const termSheetNames = ["TERM 1", "TERM 2", "TERM 3"] as const;
      const termKeys = ["First Term", "Second Term", "Third Term"] as const;

      termSheetNames.forEach((sheetName, index) => {
        const worksheet = workbook.getWorksheet(sheetName);
        if (!worksheet) return;
        fillTermSheet(worksheet, payload.terms[termKeys[index]], maleIds, femaleIds);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const safeSection = payload.section.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      anchor.download = `eim-class-record-${safeSection}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Export failed.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleExport}
        disabled={status === "working"}
        className="rounded-2xl border border-amber-300 bg-white/80 px-4 py-2.5 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-50 disabled:opacity-60 dark:border-amber-800/50 dark:bg-slate-900/80 dark:text-amber-300 dark:hover:bg-amber-950/40"
      >
        {status === "working" ? "Building DepEd file..." : "Export DepEd Class Record"}
      </button>
      {unassignedCount > 0 ? (
        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
          {unassignedCount} learner{unassignedCount === 1 ? "" : "s"} missing a Sex value and won&apos;t appear in this file — set Sex in the learner profile.
        </p>
      ) : null}
      {truncated ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">This template supports up to 50 per sex — some learners were left out.</p>
      ) : null}
      {status === "error" ? <p className="text-xs font-medium text-red-600 dark:text-red-400">{errorMessage}</p> : null}
    </div>
  );
}
