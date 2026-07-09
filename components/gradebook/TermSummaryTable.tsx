import { formatClassRecordName, formatGradebookNumber, type TermSummaryRow } from "@/lib/gradebook";

type TermSummaryTableProps = {
  rows: TermSummaryRow[];
};

const cell = "border border-slate-200 px-3 py-2 text-center tabular-nums";
const header = "border border-slate-300 bg-slate-200 px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-800";
const stickyNumberCell = "sticky left-0 z-10 border border-slate-200 bg-white px-2 py-2 text-center tabular-nums";
const stickyNameCell = "sticky left-[48px] z-10 min-w-[280px] border border-slate-200 bg-white px-3 py-2 text-left";

export function TermSummaryTable({ rows }: TermSummaryTableProps) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] border-collapse text-xs text-slate-700">
          <thead>
            <tr>
              <th colSpan={2} className={`${header} sticky left-0 top-0 z-30 min-w-[328px]`}>
                LEARNERS&apos; NAMES
              </th>
              <th className={`${header} min-w-[120px]`}>FIRST TERM</th>
              <th className={`${header} min-w-[120px]`}>SECOND TERM</th>
              <th className={`${header} min-w-[120px]`}>THIRD TERM</th>
              <th className={`${header} min-w-[120px]`}>AVERAGE</th>
              <th className={`${header} min-w-[150px]`}>REMARKS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.learnerId} className="odd:bg-white even:bg-slate-50/40 hover:bg-teal-50/40">
                <td className={stickyNumberCell}>{row.rowNumber}</td>
                <td className={stickyNameCell}>
                  <p className="font-semibold text-slate-900">{formatClassRecordName(row.fullName)}</p>
                </td>
                <td className={cell}>{formatGradebookNumber(row.firstTerm, 0)}</td>
                <td className={cell}>{formatGradebookNumber(row.secondTerm, 0)}</td>
                <td className={cell}>{formatGradebookNumber(row.thirdTerm, 0)}</td>
                <td className={`${cell} bg-slate-50 font-semibold`}>{formatGradebookNumber(row.average, 2)}</td>
                <td className={`${cell} bg-slate-50 font-semibold`}>{row.remarks ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
