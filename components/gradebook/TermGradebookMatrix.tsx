"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { hideGradebookAssessmentAction, saveGradebookChangesAction, unhideGradebookAssessmentAction } from "@/app/teacher/gradebook/actions";
import {
  categoryComputed,
  formatClassRecordName,
  formatGradebookNumber,
  formatGradebookScore,
  gradebookWeights,
  initialGrade,
  letterGrade,
  transmutedGrade,
  type EditableGradebookAssessment,
  type EditableGradebookScore,
  type EditableLearner,
  type GradebookCell
} from "@/lib/gradebook";

type TermGradebookMatrixProps = {
  learners: EditableLearner[];
  assessments: EditableGradebookAssessment[];
  hiddenAssessments: EditableGradebookAssessment[];
  scores: EditableGradebookScore[];
};

type ColumnContextMenuState = {
  x: number;
  y: number;
  assessment: EditableGradebookAssessment;
};

const dataCellBase = "h-8 border border-slate-300 text-center align-middle tabular-nums dark:border-slate-700";
const numericCell = `${dataCellBase} w-8 min-w-[2rem] p-0`;
const readOnlyCellBase = `${dataCellBase} bg-slate-50 px-1 text-[10px] font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200`;
const computedCell = `${readOnlyCellBase} w-8 min-w-[2rem]`;
const totalComputedCell = `${readOnlyCellBase} w-11 min-w-[2.75rem]`;
const gradeCell = `${readOnlyCellBase} w-20 min-w-[5rem]`;
const letterCell = `${gradeCell} text-[9px] leading-tight`;
const groupHeaderCell = "h-8 border border-slate-400 bg-slate-200 px-1.5 py-1 text-center text-[11px] font-bold uppercase tracking-[0.06em] text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200";
const headerCellBase = "h-8 border border-slate-300 bg-slate-100 px-0.5 py-0.5 text-center text-[10px] font-bold uppercase tracking-[0.04em] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
const headerCell = `${headerCellBase} w-8 min-w-[2rem]`;
const totalHeaderCell = `${headerCellBase} w-11 min-w-[2.75rem]`;
const finalGradeHeaderCell = `${groupHeaderCell} w-20 min-w-[5rem]`;
const stickyNumberCell = "sticky left-0 z-10 h-8 w-8 min-w-[2rem] border border-slate-300 bg-white p-0 text-center align-middle text-[10px] tabular-nums dark:border-slate-700 dark:bg-slate-900";
const stickyNameCell = "sticky left-[32px] z-10 h-8 min-w-[190px] border border-slate-300 bg-white px-1.5 py-1 text-left align-middle dark:border-slate-700 dark:bg-slate-900";
const numberInputChrome = "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const inputClass = `${numberInputChrome} h-8 w-8 rounded-none border-0 bg-transparent px-0 text-center text-[10px] tabular-nums outline-none focus:bg-white focus:ring-1 focus:ring-teal-500 dark:focus:bg-slate-900`;
const hpsInputClass = `${numberInputChrome} h-8 w-8 rounded-none border-0 bg-transparent px-0 text-center text-[10px] font-semibold tabular-nums outline-none focus:bg-white focus:ring-1 focus:ring-teal-500 dark:focus:bg-slate-900`;

function inputValue(value: number | null) {
  return value === null || value === undefined ? "" : String(value);
}

function parseInput(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sortAssessments(assessments: EditableGradebookAssessment[]) {
  return [...assessments].sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label));
}

function HpsInput({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      step="0.01"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={hpsInputClass}
      aria-label="Highest possible score"
    />
  );
}

export function TermGradebookMatrix({ learners, assessments, hiddenAssessments, scores }: TermGradebookMatrixProps) {
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "dirty" | "error">("saved");
  const [statusMessage, setStatusMessage] = useState("Saved");
  const [hpsValues, setHpsValues] = useState<Record<string, string>>(() =>
    Object.fromEntries([...assessments, ...hiddenAssessments].map((assessment) => [assessment.id, inputValue(assessment.highestPossible)]))
  );
  const [scoreValues, setScoreValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(scores.map((score) => [`${score.assessmentId}:${score.learnerId}`, inputValue(score.score)]))
  );
  // Starts mirroring the server's active/hidden split, then tracks this
  // session's hide/unhide clicks optimistically so the table updates
  // instantly without waiting for the server action's revalidation.
  const [activeIds, setActiveIds] = useState<Set<string>>(() => new Set(assessments.map((assessment) => assessment.id)));
  const [columnMenu, setColumnMenu] = useState<ColumnContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const allAssessments = useMemo(() => [...assessments, ...hiddenAssessments], [assessments, hiddenAssessments]);
  const visibleAssessments = useMemo(() => allAssessments.filter((assessment) => activeIds.has(assessment.id)), [allAssessments, activeIds]);
  const currentlyHidden = useMemo(
    () => sortAssessments(allAssessments.filter((assessment) => !activeIds.has(assessment.id))),
    [allAssessments, activeIds]
  );
  const writtenAssessments = useMemo(() => sortAssessments(visibleAssessments.filter((assessment) => assessment.category === "written")), [visibleAssessments]);
  const performanceAssessments = useMemo(() => sortAssessments(visibleAssessments.filter((assessment) => assessment.category === "performance")), [visibleAssessments]);
  const examAssessments = useMemo(
    () => sortAssessments(visibleAssessments.filter((assessment) => assessment.category === "summative" || assessment.category === "term_exam")),
    [visibleAssessments]
  );
  const columnWidths = useMemo(() => {
    const widths: (number | null)[] = [32, 190];
    const addCategory = (count: number) => {
      for (let i = 0; i < count; i++) widths.push(32);
      widths.push(44, 32, 32);
    };
    addCategory(writtenAssessments.length);
    addCategory(performanceAssessments.length);
    addCategory(examAssessments.length);
    widths.push(80, 80, 80);
    return widths;
  }, [writtenAssessments.length, performanceAssessments.length, examAssessments.length]);

  useEffect(() => {
    if (!columnMenu) return;

    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setColumnMenu(null);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setColumnMenu(null);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [columnMenu]);

  function markDirty() {
    setSaveStatus("dirty");
    setStatusMessage("Unsaved changes");
  }

  function getHps(assessmentId: string) {
    return parseInput(hpsValues[assessmentId] ?? "");
  }

  function getScore(assessmentId: string, learnerId: string) {
    return parseInput(scoreValues[`${assessmentId}:${learnerId}`] ?? "");
  }

  function categoryFor(learnerId: string, categoryAssessments: EditableGradebookAssessment[], weight: number) {
    const cells: GradebookCell[] = categoryAssessments.map((assessment) => ({
      score: getScore(assessment.id, learnerId),
      maxScore: getHps(assessment.id),
      title: assessment.label
    }));
    const hpsTotal = categoryAssessments.reduce((sum, assessment) => sum + (getHps(assessment.id) ?? 0), 0);
    return categoryComputed(cells, hpsTotal, weight);
  }

  function saveChanges() {
    setSaveStatus("saving");
    setStatusMessage("Saving...");

    startTransition(async () => {
      const result = await saveGradebookChangesAction({
        assessmentUpdates: visibleAssessments.map((assessment) => ({
          id: assessment.id,
          highestPossible: getHps(assessment.id)
        })),
        scoreUpdates: visibleAssessments.flatMap((assessment) =>
          learners.map((learner) => ({
            assessmentId: assessment.id,
            learnerId: learner.id,
            score: getScore(assessment.id, learner.id)
          }))
        )
      });

      if (result.ok) {
        setSaveStatus("saved");
        setStatusMessage("Saved");
      } else {
        setSaveStatus("error");
        setStatusMessage(result.message);
      }
    });
  }

  function hideAssessment(assessment: EditableGradebookAssessment) {
    if (assessment.category === "term_exam") return;
    setColumnMenu(null);

    startTransition(async () => {
      const result = await hideGradebookAssessmentAction(assessment.id);
      if (result.ok) {
        setActiveIds((current) => {
          const next = new Set(current);
          next.delete(assessment.id);
          return next;
        });
      } else {
        setSaveStatus("error");
        setStatusMessage(result.message);
      }
    });
  }

  function unhideAssessment(assessment: EditableGradebookAssessment) {
    setColumnMenu(null);

    startTransition(async () => {
      const result = await unhideGradebookAssessmentAction(assessment.id);
      if (result.ok) {
        setActiveIds((current) => new Set([...current, assessment.id]));
      } else {
        setSaveStatus("error");
        setStatusMessage(result.message);
      }
    });
  }

  function renderAssessmentHeader(assessment: EditableGradebookAssessment) {
    return (
      <th
        key={assessment.id}
        className={`${headerCell} sticky top-[32px] z-20 cursor-context-menu`}
        onContextMenu={(event) => {
          event.preventDefault();
          setColumnMenu({ x: event.clientX, y: event.clientY, assessment });
        }}
      >
        {assessment.label}
      </th>
    );
  }

  function renderComputedHeaders(group: string) {
    return ["Total", "PS", "WS"].map((label) => (
      <th key={`${group}-${label}`} className={`${label === "Total" ? totalHeaderCell : headerCell} sticky top-[32px] z-20`}>
        {label}
      </th>
    ));
  }

  function renderScoreInput(assessment: EditableGradebookAssessment, learner: EditableLearner) {
    const key = `${assessment.id}:${learner.id}`;
    const score = getScore(assessment.id, learner.id);
    const hps = getHps(assessment.id);
    const isOverHps = score !== null && hps !== null && hps > 0 && score > hps;

    return (
      <td key={key} className={`${numericCell} ${isOverHps ? "bg-red-50 dark:bg-red-950/30" : ""}`}>
        <input
          type="number"
          min={0}
          step="0.01"
          value={scoreValues[key] ?? ""}
          onChange={(event) => {
            setScoreValues((current) => ({ ...current, [key]: event.target.value }));
            markDirty();
          }}
          className={`${inputClass} ${isOverHps ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-300 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-900/50" : ""}`}
          aria-label={`${learner.fullName} ${assessment.label} score`}
        />
      </td>
    );
  }

  function renderHpsInputs(categoryAssessments: EditableGradebookAssessment[]) {
    return categoryAssessments.map((assessment) => (
      <td key={`hps-${assessment.id}`} className={`${numericCell} sticky top-[64px] z-20 bg-slate-50 font-medium dark:bg-slate-800`}>
        <HpsInput
          value={hpsValues[assessment.id] ?? ""}
          onChange={(value) => {
            setHpsValues((current) => ({ ...current, [assessment.id]: value }));
            markDirty();
          }}
        />
      </td>
    ));
  }

  function hpsTotal(categoryAssessments: EditableGradebookAssessment[]) {
    return categoryAssessments.reduce((sum, assessment) => sum + (getHps(assessment.id) ?? 0), 0);
  }

  function renderHpsComputed(categoryAssessments: EditableGradebookAssessment[], weight: number) {
    const total = hpsTotal(categoryAssessments);
    return (
      <>
        <td className={`${totalComputedCell} sticky top-[64px] z-20`}>{formatGradebookScore(total || null)}</td>
        <td className={`${computedCell} sticky top-[64px] z-20 bg-slate-50 dark:bg-slate-800`}>{total ? "100.00" : ""}</td>
        <td className={`${computedCell} sticky top-[64px] z-20 bg-slate-50 dark:bg-slate-800`}>{total ? formatGradebookNumber(weight * 100) : ""}</td>
      </>
    );
  }

  function renderLearnerCategory(learner: EditableLearner, categoryAssessments: EditableGradebookAssessment[], weight: number) {
    const computed = categoryFor(learner.id, categoryAssessments, weight);
    return (
      <>
        {categoryAssessments.map((assessment) => renderScoreInput(assessment, learner))}
        <td className={totalComputedCell}>{formatGradebookNumber(computed.total, 0)}</td>
        <td className={computedCell}>{formatGradebookNumber(computed.ps)}</td>
        <td className={computedCell}>{formatGradebookNumber(computed.ws)}</td>
      </>
    );
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className={saveStatus === "error" ? "text-sm font-semibold text-red-600 dark:text-red-400" : saveStatus === "dirty" ? "text-sm font-semibold text-amber-700 dark:text-amber-300" : "text-sm font-semibold text-teal-700 dark:text-amber-400"}>
          {isPending ? "Saving..." : statusMessage}
        </p>
        <button
          type="button"
          onClick={saveChanges}
          disabled={isPending}
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save Changes
        </button>
      </div>

      <div className="max-h-[75vh] overflow-auto">
        <table className="table-fixed border-separate border-spacing-0 border border-slate-400 bg-white text-xs text-slate-700 shadow-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
          <colgroup>
            {columnWidths.map((width, index) => (
              <col key={index} style={width ? { width: `${width}px` } : undefined} />
            ))}
          </colgroup>
          <thead>
              <tr>
                <th rowSpan={2} colSpan={2} className={`${groupHeaderCell} sticky left-0 top-0 z-30 min-w-[222px]`}>
                  LEARNERS&apos; NAMES
                </th>
                <th colSpan={writtenAssessments.length + 3} className={`${groupHeaderCell} sticky top-0 z-20`}>
                  WRITTEN / ORAL WORKS (15%)
                </th>
                <th colSpan={performanceAssessments.length + 3} className={`${groupHeaderCell} sticky top-0 z-20`}>
                  PRODUCT / PERFORMANCE TASKS (65%)
                </th>
                <th colSpan={examAssessments.length + 3} className={`${groupHeaderCell} sticky top-0 z-20`}>
                  SUMMATIVE TESTS &amp; TERM EXAMINATION (20%)
                </th>
                <th rowSpan={2} className={`${finalGradeHeaderCell} sticky top-0 z-20`}>
                  Initial Grade
                </th>
                <th rowSpan={2} className={`${finalGradeHeaderCell} sticky top-0 z-20`}>
                  Transmuted Grade
                </th>
                <th rowSpan={2} className={`${finalGradeHeaderCell} sticky top-0 z-20`}>
                  Letter Grade
                </th>
              </tr>
              <tr>
                {writtenAssessments.map(renderAssessmentHeader)}
                {renderComputedHeaders("written")}
                {performanceAssessments.map(renderAssessmentHeader)}
                {renderComputedHeaders("performance")}
                {examAssessments.map(renderAssessmentHeader)}
                {renderComputedHeaders("exam")}
              </tr>
              <tr>
                <th colSpan={2} className={`${headerCellBase} sticky left-0 top-[64px] z-30 min-w-[222px] bg-slate-50 dark:bg-slate-800`}>
                  HIGHEST POSSIBLE SCORE
                </th>
                {renderHpsInputs(writtenAssessments)}
                {renderHpsComputed(writtenAssessments, gradebookWeights.written)}
                {renderHpsInputs(performanceAssessments)}
                {renderHpsComputed(performanceAssessments, gradebookWeights.performance)}
                {renderHpsInputs(examAssessments)}
                {renderHpsComputed(examAssessments, gradebookWeights.exam)}
                <td className={`${gradeCell} sticky top-[64px] z-20`}></td>
                <td className={`${gradeCell} sticky top-[64px] z-20`}></td>
                <td className={`${gradeCell} sticky top-[64px] z-20`}></td>
              </tr>
            </thead>
            <tbody>
              {learners.map((learner) => {
                const written = categoryFor(learner.id, writtenAssessments, gradebookWeights.written);
                const performance = categoryFor(learner.id, performanceAssessments, gradebookWeights.performance);
                const exam = categoryFor(learner.id, examAssessments, gradebookWeights.exam);
                const initial = initialGrade(written.ws, performance.ws, exam.ws);
                const transmuted = transmutedGrade(initial);
                const letter = letterGrade(transmuted);

                return (
                  <tr key={learner.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-teal-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-800/40 dark:hover:bg-amber-950/40">
                    <td className={stickyNumberCell}>{learner.rowNumber}</td>
                    <td className={stickyNameCell}>
                      <p className="whitespace-nowrap text-[10px] font-semibold text-slate-900 dark:text-slate-100">{formatClassRecordName(learner.fullName)}</p>
                    </td>
                    {renderLearnerCategory(learner, writtenAssessments, gradebookWeights.written)}
                    {renderLearnerCategory(learner, performanceAssessments, gradebookWeights.performance)}
                    {renderLearnerCategory(learner, examAssessments, gradebookWeights.exam)}
                    <td className={gradeCell}>{formatGradebookNumber(initial)}</td>
                    <td className={gradeCell}>{formatGradebookNumber(transmuted, 0)}</td>
                    <td className={letterCell}>{letter ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
        </table>
      </div>

      {columnMenu ? (
        <div
          ref={menuRef}
          role="menu"
          style={{ left: columnMenu.x, top: columnMenu.y }}
          className="fixed z-50 min-w-52 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xl shadow-slate-950/10 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/40"
        >
          {columnMenu.assessment.category !== "term_exam" ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => hideAssessment(columnMenu.assessment)}
              className="block w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hide &ldquo;{columnMenu.assessment.label}&rdquo;
            </button>
          ) : (
            <p className="px-3.5 py-2.5 text-xs text-slate-400 dark:text-slate-500">Term exam columns can&apos;t be hidden.</p>
          )}

          {currentlyHidden.length ? (
            <>
              <p className="mt-1 border-t border-slate-100 px-3.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:border-slate-800 dark:text-slate-500">
                Unhide
              </p>
              {currentlyHidden.map((hidden) => (
                <button
                  key={hidden.id}
                  type="button"
                  role="menuitem"
                  onClick={() => unhideAssessment(hidden)}
                  className="block w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {hidden.label}
                </button>
              ))}
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
