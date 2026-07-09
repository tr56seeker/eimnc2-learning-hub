"use client";

import { useMemo, useState, useTransition } from "react";
import { hideGradebookAssessmentAction, saveGradebookChangesAction } from "@/app/teacher/gradebook/actions";
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
  scores: EditableGradebookScore[];
};

const dataCellBase = "h-10 border border-slate-300 text-center align-middle tabular-nums";
const numericCell = `${dataCellBase} w-10 min-w-[2.5rem] p-0`;
const readOnlyCellBase = `${dataCellBase} bg-slate-50 px-1 text-[11px] font-semibold text-slate-800`;
const computedCell = `${readOnlyCellBase} w-10 min-w-[2.5rem]`;
const totalComputedCell = `${readOnlyCellBase} w-[3.25rem] min-w-[3.25rem]`;
const gradeCell = `${readOnlyCellBase} w-[6rem] min-w-[6rem]`;
const letterCell = `${gradeCell} text-[10px] leading-tight`;
const groupHeaderCell = "h-10 border border-slate-400 bg-slate-200 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-800";
const headerCellBase = "h-10 border border-slate-300 bg-slate-100 px-1 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-700";
const headerCell = `${headerCellBase} w-10 min-w-[2.5rem]`;
const totalHeaderCell = `${headerCellBase} w-[3.25rem] min-w-[3.25rem]`;
const finalGradeHeaderCell = `${groupHeaderCell} w-[6rem] min-w-[6rem]`;
const stickyNumberCell = "sticky left-0 z-10 h-10 w-12 min-w-[3rem] border border-slate-300 bg-white p-0 text-center align-middle tabular-nums";
const stickyNameCell = "sticky left-[48px] z-10 h-10 min-w-[224px] border border-slate-300 bg-white px-2 py-1.5 text-left align-middle";
const numberInputChrome = "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const inputClass = `${numberInputChrome} h-10 w-10 rounded-none border-0 bg-transparent px-0 text-center text-[11px] tabular-nums outline-none focus:bg-white focus:ring-1 focus:ring-teal-500`;
const hpsInputClass = `${numberInputChrome} h-10 w-10 rounded-none border-0 bg-transparent px-0 text-center text-[11px] font-semibold tabular-nums outline-none focus:bg-white focus:ring-1 focus:ring-teal-500`;

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

export function TermGradebookMatrix({ learners, assessments, scores }: TermGradebookMatrixProps) {
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "dirty" | "error">("saved");
  const [statusMessage, setStatusMessage] = useState("Saved");
  const [hpsValues, setHpsValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(assessments.map((assessment) => [assessment.id, inputValue(assessment.highestPossible)]))
  );
  const [scoreValues, setScoreValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(scores.map((score) => [`${score.assessmentId}:${score.learnerId}`, inputValue(score.score)]))
  );
  const [hiddenAssessmentIds, setHiddenAssessmentIds] = useState<Set<string>>(new Set());

  const visibleAssessments = assessments.filter((assessment) => !hiddenAssessmentIds.has(assessment.id));
  const writtenAssessments = useMemo(() => sortAssessments(visibleAssessments.filter((assessment) => assessment.category === "written")), [visibleAssessments]);
  const performanceAssessments = useMemo(() => sortAssessments(visibleAssessments.filter((assessment) => assessment.category === "performance")), [visibleAssessments]);
  const examAssessments = useMemo(
    () => sortAssessments(visibleAssessments.filter((assessment) => assessment.category === "summative" || assessment.category === "term_exam")),
    [visibleAssessments]
  );

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
        assessmentUpdates: assessments.map((assessment) => ({
          id: assessment.id,
          highestPossible: getHps(assessment.id)
        })),
        scoreUpdates: assessments.flatMap((assessment) =>
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
    if (!window.confirm(`Hide ${assessment.label}? Existing scores are preserved.`)) return;

    startTransition(async () => {
      const result = await hideGradebookAssessmentAction(assessment.id);
      if (result.ok) {
        setHiddenAssessmentIds((current) => new Set([...current, assessment.id]));
      } else {
        setSaveStatus("error");
        setStatusMessage(result.message);
      }
    });
  }

  function renderAssessmentHeader(assessment: EditableGradebookAssessment) {
    return (
      <th key={assessment.id} className={`${headerCell} sticky top-[40px] z-20`}>
        <div className="flex items-center justify-center gap-1">
          <span>{assessment.label}</span>
          {assessment.category !== "term_exam" ? (
            <button
              type="button"
              onClick={() => hideAssessment(assessment)}
              className="px-1 text-[10px] text-slate-400 hover:bg-red-50 hover:text-red-600"
              title="Hide column"
            >
              x
            </button>
          ) : null}
        </div>
      </th>
    );
  }

  function renderComputedHeaders(group: string) {
    return ["Total", "PS", "WS"].map((label) => (
      <th key={`${group}-${label}`} className={`${label === "Total" ? totalHeaderCell : headerCell} sticky top-[40px] z-20`}>
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
      <td key={key} className={`${numericCell} ${isOverHps ? "bg-red-50" : ""}`}>
        <input
          type="number"
          min={0}
          step="0.01"
          value={scoreValues[key] ?? ""}
          onChange={(event) => {
            setScoreValues((current) => ({ ...current, [key]: event.target.value }));
            markDirty();
          }}
          className={`${inputClass} ${isOverHps ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-300" : ""}`}
          aria-label={`${learner.fullName} ${assessment.label} score`}
        />
      </td>
    );
  }

  function renderHpsInputs(categoryAssessments: EditableGradebookAssessment[]) {
    return categoryAssessments.map((assessment) => (
      <td key={`hps-${assessment.id}`} className={`${numericCell} bg-slate-50 font-medium`}>
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
        <td className={totalComputedCell}>{formatGradebookScore(total || null)}</td>
        <td className={`${computedCell} bg-slate-50`}>{total ? "100.00" : ""}</td>
        <td className={`${computedCell} bg-slate-50`}>{total ? formatGradebookNumber(weight * 100) : ""}</td>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={saveStatus === "error" ? "text-sm font-semibold text-red-600" : saveStatus === "dirty" ? "text-sm font-semibold text-amber-700" : "text-sm font-semibold text-teal-700"}>
          {isPending ? "Saving..." : statusMessage}
        </p>
        <button
          type="button"
          onClick={saveChanges}
          disabled={isPending}
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save Changes
        </button>
      </div>

      <div className="overflow-hidden rounded-none border border-slate-400 bg-white shadow-none">
        <div className="overflow-x-auto">
          <table className="w-max min-w-max border-collapse text-xs text-slate-700">
            <thead>
              <tr>
                <th rowSpan={2} colSpan={2} className={`${groupHeaderCell} sticky left-0 top-0 z-30 min-w-[272px]`}>
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
                <th colSpan={2} className={`${headerCellBase} sticky left-0 top-[80px] z-30 min-w-[272px] bg-slate-50 text-left`}>
                  HIGHEST POSSIBLE SCORE
                </th>
                {renderHpsInputs(writtenAssessments)}
                {renderHpsComputed(writtenAssessments, gradebookWeights.written)}
                {renderHpsInputs(performanceAssessments)}
                {renderHpsComputed(performanceAssessments, gradebookWeights.performance)}
                {renderHpsInputs(examAssessments)}
                {renderHpsComputed(examAssessments, gradebookWeights.exam)}
                <td className={gradeCell}></td>
                <td className={gradeCell}></td>
                <td className={gradeCell}></td>
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
                  <tr key={learner.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-teal-50/40">
                    <td className={stickyNumberCell}>{learner.rowNumber}</td>
                    <td className={stickyNameCell}>
                      <p className="whitespace-nowrap text-[11px] font-semibold text-slate-900">{formatClassRecordName(learner.fullName)}</p>
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
      </div>
    </section>
  );
}
