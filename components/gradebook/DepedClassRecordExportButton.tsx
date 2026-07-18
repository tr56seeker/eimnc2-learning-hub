"use client";

import { useState } from "react";
import {
  DEPED_SCHOOL_INFO,
  DEPED_SUBJECT_INFO,
  type DepedExportPayload,
  type DepedTermData
} from "@/lib/deped-export";
import { clearCell, columnLetters, mapSheetNameToPath, setNumberCell, setStringCell } from "@/lib/xlsx-raw-cells";

const MAX_PER_SEX = 50;

// Raw score input columns the template exposes: written F-J, performance N-P, SA1/SA2/TE T-V.
const SCORE_COLUMNS = [6, 7, 8, 9, 10, 14, 15, 16, 20, 21, 22].map(columnLetters);
const MALE_ROWS = Array.from({ length: MAX_PER_SEX }, (_, i) => 13 + i);
const FEMALE_ROWS = Array.from({ length: MAX_PER_SEX }, (_, i) => 64 + i);

function writeRowScores(
  xml: string,
  row: number,
  scores: { written: (number | null)[]; performance: (number | null)[]; sa1: number | null; sa2: number | null; te: number | null }
) {
  scores.written.forEach((value, index) => {
    if (value !== null) xml = setNumberCell(xml, `${columnLetters(6 + index)}${row}`, value); // F..J
  });
  scores.performance.forEach((value, index) => {
    if (value !== null) xml = setNumberCell(xml, `${columnLetters(14 + index)}${row}`, value); // N..P
  });
  if (scores.sa1 !== null) xml = setNumberCell(xml, `T${row}`, scores.sa1);
  if (scores.sa2 !== null) xml = setNumberCell(xml, `U${row}`, scores.sa2);
  if (scores.te !== null) xml = setNumberCell(xml, `V${row}`, scores.te);
  return xml;
}

function fillTermSheet(xml: string, termData: DepedTermData, maleLearnerIds: string[], femaleLearnerIds: string[]) {
  // Always clear before writing — the template is expected to be blank, but this guards
  // against it ever being re-saved with real scores still in it (see the class record
  // incident where a filled-in copy sat in public/templates for months).
  for (const row of [11, ...MALE_ROWS, ...FEMALE_ROWS]) {
    for (const col of SCORE_COLUMNS) xml = clearCell(xml, `${col}${row}`);
  }

  termData.writtenHPS.forEach((value, index) => {
    if (value !== null) xml = setNumberCell(xml, `${columnLetters(6 + index)}11`, value);
  });
  termData.performanceHPS.forEach((value, index) => {
    if (value !== null) xml = setNumberCell(xml, `${columnLetters(14 + index)}11`, value);
  });
  if (termData.sa1HPS !== null) xml = setNumberCell(xml, "T11", termData.sa1HPS);
  if (termData.sa2HPS !== null) xml = setNumberCell(xml, "U11", termData.sa2HPS);
  if (termData.teHPS !== null) xml = setNumberCell(xml, "V11", termData.teHPS);

  maleLearnerIds.slice(0, MAX_PER_SEX).forEach((learnerId, index) => {
    const scores = termData.scoresByLearner[learnerId];
    if (scores) xml = writeRowScores(xml, MALE_ROWS[index], scores);
  });

  femaleLearnerIds.slice(0, MAX_PER_SEX).forEach((learnerId, index) => {
    const scores = termData.scoresByLearner[learnerId];
    if (scores) xml = writeRowScores(xml, FEMALE_ROWS[index], scores);
  });

  return xml;
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
      const response = await fetch("/api/gradebook/deped-template");
      if (!response.ok) throw new Error("Could not load the DepEd template file.");
      const templateBuffer = await response.arrayBuffer();

      // Edited at the raw XML level rather than via exceljs's read-modify-write cycle:
      // exceljs rebuilds styles.xml on every write, which for this template's hundreds of
      // hand-set cell styles causes real, visible formatting loss in Excel. Touching only
      // the specific <c> value nodes keeps every other part of the file byte-identical.
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(templateBuffer);
      const sheetPaths = await mapSheetNameToPath(zip);

      const inputDataPath = sheetPaths["INPUT DATA"];
      if (!inputDataPath) throw new Error("Template is missing the INPUT DATA sheet.");
      let inputDataXml = await zip.file(inputDataPath)!.async("string");

      inputDataXml = setStringCell(inputDataXml, "F10", DEPED_SCHOOL_INFO.region);
      inputDataXml = setStringCell(inputDataXml, "F11", DEPED_SCHOOL_INFO.division);
      inputDataXml = setStringCell(inputDataXml, "F13", DEPED_SCHOOL_INFO.schoolId);
      inputDataXml = setStringCell(inputDataXml, "F14", DEPED_SCHOOL_INFO.schoolName);
      inputDataXml = setStringCell(inputDataXml, "F16", payload.schoolYear);
      inputDataXml = setStringCell(inputDataXml, "F22", payload.teacherName);
      inputDataXml = setStringCell(inputDataXml, "F23", DEPED_SUBJECT_INFO.track);
      inputDataXml = setStringCell(inputDataXml, "F24", String(payload.gradeLevel));
      inputDataXml = setStringCell(inputDataXml, "F25", payload.section);
      inputDataXml = setStringCell(inputDataXml, "F26", DEPED_SUBJECT_INFO.subjectType);
      inputDataXml = setStringCell(inputDataXml, "F28", DEPED_SUBJECT_INFO.subject);

      // Always clear the full roster range first — if the current section has fewer
      // learners than a previous export left behind, stale names must not survive.
      for (let row = 11; row <= 11 + MAX_PER_SEX - 1; row++) {
        for (const col of ["K", "L", "N", "O"]) inputDataXml = clearCell(inputDataXml, `${col}${row}`);
      }

      maleLearners.slice(0, MAX_PER_SEX).forEach((learner, index) => {
        inputDataXml = setNumberCell(inputDataXml, `K${11 + index}`, index + 1);
        inputDataXml = setStringCell(inputDataXml, `L${11 + index}`, learner.fullName);
      });
      femaleLearners.slice(0, MAX_PER_SEX).forEach((learner, index) => {
        inputDataXml = setNumberCell(inputDataXml, `N${11 + index}`, index + 1);
        inputDataXml = setStringCell(inputDataXml, `O${11 + index}`, learner.fullName);
      });
      zip.file(inputDataPath, inputDataXml);

      const maleIds = maleLearners.map((learner) => learner.id);
      const femaleIds = femaleLearners.map((learner) => learner.id);

      const termSheetNames = ["TERM 1", "TERM 2", "TERM 3"] as const;
      const termKeys = ["First Term", "Second Term", "Third Term"] as const;

      for (const [index, sheetName] of termSheetNames.entries()) {
        const path = sheetPaths[sheetName];
        if (!path) continue;
        let xml = await zip.file(path)!.async("string");
        xml = fillTermSheet(xml, payload.terms[termKeys[index]], maleIds, femaleIds);
        zip.file(path, xml);
      }

      const buffer = await zip.generateAsync({ type: "blob" });
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
        className="rounded-2xl border border-amber-300 bg-white/80 px-4 py-2.5 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-50 active:scale-[0.97] disabled:opacity-60 dark:border-amber-800/50 dark:bg-slate-900/80 dark:text-amber-300 dark:hover:bg-amber-950/40"
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
