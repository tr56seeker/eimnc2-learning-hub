import { formatClassRecordName, formatGradebookNumber, type TermSummaryRow } from "@/lib/gradebook";

type TermSummaryTableProps = {
  rows: TermSummaryRow[];
};

const columnWidths = [32, 190, 100, 100, 100, 100, 140];

const cell = "h-8 border border-slate-300 px-2 text-center tabular-nums text-[10px] text-slate-700 dark:border-slate-700 dark:text-slate-300";
const header = "h-8 border border-slate-300 bg-slate-100 px-1.5 text-center text-[10px] font-bold uppercase tracking-[0.06em] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
const stickyNumberCell = "sticky left-0 z-10 h-8 border border-slate-300 bg-white p-0 text-center align-middle text-[10px] tabular-nums dark:border-slate-700 dark:bg-slate-900";
const stickyNameCell = "sticky left-[32px] z-10 h-8 border border-slate-300 bg-white px-1.5 py-1 text-left align-middle dark:border-slate-700 dark:bg-slate-900";

export function TermSummaryTable({ rows }: TermSummaryTableProps) {
  return (
    <div className="max-h-[75vh] overflow-auto">
      <table className="table-fixed border-separate border-spacing-0 border border-slate-400 bg-white text-xs text-slate-700 shadow-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
        <colgroup>
          {columnWidths.map((width, index) => (
            <col key={index} style={{ width: `${width}px` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th colSpan={2} className={`${header} sticky left-0 top-0 z-30`}>
              LEARNERS&apos; NAMES
            </th>
            <th className={`${header} sticky top-0 z-20`}>FIRST TERM</th>
            <th className={`${header} sticky top-0 z-20`}>SECOND TERM</th>
            <th className={`${header} sticky top-0 z-20`}>THIRD TERM</th>
            <th className={`${header} sticky top-0 z-20`}>AVERAGE</th>
            <th className={`${header} sticky top-0 z-20`}>REMARKS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.learnerId} className="odd:bg-white even:bg-slate-50/40 hover:bg-teal-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-800/40 dark:hover:bg-teal-950/40">
              <td className={stickyNumberCell}>{row.rowNumber}</td>
              <td className={stickyNameCell}>
                <p className="whitespace-nowrap text-[10px] font-semibold text-slate-900 dark:text-slate-100">{formatClassRecordName(row.fullName)}</p>
              </td>
              <td className={cell}>{formatGradebookNumber(row.firstTerm, 0)}</td>
              <td className={cell}>{formatGradebookNumber(row.secondTerm, 0)}</td>
              <td className={cell}>{formatGradebookNumber(row.thirdTerm, 0)}</td>
              <td className={`${cell} bg-slate-50 font-semibold dark:bg-slate-800`}>{formatGradebookNumber(row.average, 2)}</td>
              <td className={`${cell} bg-slate-50 font-semibold dark:bg-slate-800`}>{row.remarks ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
