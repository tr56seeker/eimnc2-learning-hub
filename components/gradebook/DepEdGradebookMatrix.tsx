import {
  formatClassRecordName,
  formatGradebookNumber,
  formatGradebookScore,
  gradebookWeights,
  type GradebookHighestScores,
  type GradebookMatrixRow
} from "@/lib/gradebook";

type DepEdGradebookMatrixProps = {
  rows: GradebookMatrixRow[];
  highestScores: GradebookHighestScores;
};

const dataCellBase = "h-10 border border-slate-300 text-center align-middle tabular-nums";
const numericCell = `${dataCellBase} w-10 min-w-[2.5rem] p-0`;
const readOnlyCellBase = `${dataCellBase} bg-slate-50 px-1 text-[11px] font-semibold text-slate-800`;
const computedCell = `${readOnlyCellBase} w-10 min-w-[2.5rem]`;
const totalComputedCell = `${readOnlyCellBase} w-[3.25rem] min-w-[3.25rem]`;
const gradeCell = `${readOnlyCellBase} w-[6rem] min-w-[6rem]`;
const letterCell = `${gradeCell} text-[10px] leading-tight`;
const headerCellBase = "h-10 border border-slate-300 bg-slate-100 px-1 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-700";
const headerCell = `${headerCellBase} w-10 min-w-[2.5rem]`;
const totalHeaderCell = `${headerCellBase} w-[3.25rem] min-w-[3.25rem]`;
const groupHeaderCell = "h-10 border border-slate-400 bg-slate-200 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-800";
const finalGradeHeaderCell = `${groupHeaderCell} w-[6rem] min-w-[6rem]`;
const stickyNumberCell = "sticky left-0 z-10 h-10 w-12 min-w-[3rem] border border-slate-300 bg-white p-0 text-center align-middle tabular-nums";
const stickyNameCell = "sticky left-[48px] z-10 h-10 min-w-[224px] border border-slate-300 bg-white px-2 py-1.5 text-left align-middle";

function ScoreCell({ score, title }: { score: number | null; title?: string | null }) {
  return (
    <td title={title ?? undefined} className={numericCell}>
      {formatGradebookScore(score)}
    </td>
  );
}

function HpsCell({ value, isTotal = false }: { value: number | null; isTotal?: boolean }) {
  return <td className={`${isTotal ? totalComputedCell : numericCell} bg-slate-50 font-medium`}>{formatGradebookScore(value)}</td>;
}

function ComputedCell({ value, digits = 2, isTotal = false }: { value: number | null; digits?: number; isTotal?: boolean }) {
  return <td className={isTotal ? totalComputedCell : computedCell}>{formatGradebookNumber(value, digits)}</td>;
}

function headerClassFor(label: string) {
  return label === "Total" ? totalHeaderCell : headerCell;
}

export function DepEdGradebookMatrix({ rows, highestScores }: DepEdGradebookMatrixProps) {
  const writtenWeight = gradebookWeights.written * 100;
  const performanceWeight = gradebookWeights.performance * 100;
  const examWeight = gradebookWeights.exam * 100;

  return (
    <div className="overflow-hidden rounded-none border border-slate-400 bg-white shadow-none">
      <div className="overflow-x-auto">
        <table className="w-max min-w-max border-collapse text-xs text-slate-700">
          <thead>
            <tr>
              <th rowSpan={2} colSpan={2} className={`${groupHeaderCell} sticky left-0 top-0 z-30 min-w-[272px]`}>
                LEARNERS&apos; NAMES
              </th>
              <th colSpan={8} className={`${groupHeaderCell} sticky top-0 z-20`}>
                WRITTEN / ORAL WORKS (15%)
              </th>
              <th colSpan={6} className={`${groupHeaderCell} sticky top-0 z-20`}>
                PRODUCT / PERFORMANCE TASKS (65%)
              </th>
              <th colSpan={6} className={`${groupHeaderCell} sticky top-0 z-20`}>
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
              {["1", "2", "3", "4", "5", "Total", "PS", "WS"].map((label) => (
                <th key={`written-${label}`} className={`${headerClassFor(label)} sticky top-[40px] z-20`}>
                  {label}
                </th>
              ))}
              {["1", "2", "3", "Total", "PS", "WS"].map((label) => (
                <th key={`performance-${label}`} className={`${headerClassFor(label)} sticky top-[40px] z-20`}>
                  {label}
                </th>
              ))}
              {["SA1", "SA2", "TE", "Total", "PS", "WS"].map((label) => (
                <th key={`exam-${label}`} className={`${headerClassFor(label)} sticky top-[40px] z-20`}>
                  {label}
                </th>
              ))}
            </tr>
            <tr>
              <th colSpan={2} className={`${headerCellBase} sticky left-0 top-[80px] z-30 min-w-[272px] bg-slate-50 text-left`}>
                HIGHEST POSSIBLE SCORE
              </th>
              {highestScores.written.map((score, index) => (
                <HpsCell key={`written-hps-${index}`} value={score} />
              ))}
              <HpsCell value={highestScores.writtenTotal || null} isTotal />
              <td className={`${computedCell} bg-slate-50`}>{highestScores.writtenTotal ? "100.00" : ""}</td>
              <td className={`${computedCell} bg-slate-50`}>{highestScores.writtenTotal ? formatGradebookNumber(writtenWeight) : ""}</td>

              {highestScores.performance.map((score, index) => (
                <HpsCell key={`performance-hps-${index}`} value={score} />
              ))}
              <HpsCell value={highestScores.performanceTotal || null} isTotal />
              <td className={`${computedCell} bg-slate-50`}>{highestScores.performanceTotal ? "100.00" : ""}</td>
              <td className={`${computedCell} bg-slate-50`}>{highestScores.performanceTotal ? formatGradebookNumber(performanceWeight) : ""}</td>

              {highestScores.exams.map((score, index) => (
                <HpsCell key={`exam-hps-${index}`} value={score} />
              ))}
              <HpsCell value={highestScores.examTotal || null} isTotal />
              <td className={`${computedCell} bg-slate-50`}>{highestScores.examTotal ? "100.00" : ""}</td>
              <td className={`${computedCell} bg-slate-50`}>{highestScores.examTotal ? formatGradebookNumber(examWeight) : ""}</td>

              <td className={gradeCell}></td>
              <td className={gradeCell}></td>
              <td className={gradeCell}></td>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.learnerId} className="odd:bg-white even:bg-slate-50/40 hover:bg-teal-50/40">
                <td className={stickyNumberCell}>{row.rowNumber}</td>
                <td className={stickyNameCell}>
                  <p className="whitespace-nowrap text-[11px] font-semibold text-slate-900">{formatClassRecordName(row.fullName)}</p>
                </td>

                {row.written.map((cell, index) => (
                  <ScoreCell key={`written-${row.learnerId}-${index}`} score={cell.score} title={cell.title} />
                ))}
                <ComputedCell value={row.writtenComputed.total} digits={0} isTotal />
                <ComputedCell value={row.writtenComputed.ps} />
                <ComputedCell value={row.writtenComputed.ws} />

                {row.performance.map((cell, index) => (
                  <ScoreCell key={`performance-${row.learnerId}-${index}`} score={cell.score} title={cell.title} />
                ))}
                <ComputedCell value={row.performanceComputed.total} digits={0} isTotal />
                <ComputedCell value={row.performanceComputed.ps} />
                <ComputedCell value={row.performanceComputed.ws} />

                {row.exams.map((cell, index) => (
                  <ScoreCell key={`exam-${row.learnerId}-${index}`} score={cell.score} title={cell.title} />
                ))}
                <ComputedCell value={row.examComputed.total} digits={0} isTotal />
                <ComputedCell value={row.examComputed.ps} />
                <ComputedCell value={row.examComputed.ws} />

                <td className={gradeCell}>{formatGradebookNumber(row.initialGrade)}</td>
                <td className={gradeCell}>{formatGradebookNumber(row.transmutedGrade, 0)}</td>
                <td className={letterCell}>{row.letterGrade ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
