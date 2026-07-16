import { EmptyState } from "@/components/EmptyState";
import { PortalShell } from "@/components/PortalShell";
import { ReportPrintHeader } from "@/components/reports/ReportPrintHeader";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { SectionHeader } from "@/components/SectionHeader";
import { formatDateTime } from "@/lib/format";
import { firstRelation } from "@/lib/relations";
import { requireAdmin } from "@/lib/auth";
import type { CsvColumn, CsvRow } from "@/lib/csv";

type LogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

const PAGE_SIZE = 200;

export default async function AuditLogsPage({
  searchParams
}: {
  searchParams: Promise<{ action?: string; from?: string; to?: string }>;
}) {
  const { action, from, to } = await searchParams;
  const { profile, supabase } = await requireAdmin();

  let query = supabase
    .from("activity_logs")
    .select("id, actor_id, action, metadata, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (action) query = query.ilike("action", `%${action}%`);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);

  const { data: logs } = await query.returns<LogRow[]>();
  const rows = logs ?? [];

  const columns: CsvColumn[] = [
    { key: "createdAt", label: "Date/Time" },
    { key: "actor", label: "Actor" },
    { key: "action", label: "Action" },
    { key: "metadata", label: "Details" }
  ];
  const csvRows: CsvRow[] = rows.map((row) => ({
    createdAt: formatDateTime(row.created_at),
    actor: firstRelation(row.profiles)?.full_name ?? "System",
    action: row.action,
    metadata: row.metadata ? JSON.stringify(row.metadata) : ""
  }));

  return (
    <PortalShell profile={profile}>
      <ReportPrintHeader title="Audit Log" preparedBy={profile.full_name} />

      <SectionHeader
        eyebrow="Administration"
        title="Audit Log"
        description={`The most recent ${PAGE_SIZE} recorded actions. Covers account, section, gradebook, incident, and academic-structure changes made through the app.`}
      />

      <div className="print:hidden mb-7 flex flex-wrap items-end justify-between gap-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <label className="grid gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            Action contains
            <input name="action" defaultValue={action ?? ""} placeholder="learner.created" className="focus-ring min-h-10 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            From
            <input name="from" type="date" defaultValue={from ?? ""} className="focus-ring min-h-10 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            To
            <input name="to" type="date" defaultValue={to ?? ""} className="focus-ring min-h-10 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <button type="submit" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 active:scale-[0.97]">
            Filter
          </button>
        </form>
        {rows.length ? <ReportToolbar filename="audit-log.csv" columns={columns} rows={csvRows} /> : null}
      </div>

      {!rows.length ? (
        <EmptyState title="No log entries" message="Actions recorded going forward will appear here." />
      ) : (
        <div className="premium-table overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left">Date/Time</th>
                <th className="px-5 py-3 text-left">Actor</th>
                <th className="px-5 py-3 text-left">Action</th>
                <th className="px-5 py-3 text-left">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-slate-400">{formatDateTime(row.created_at)}</td>
                  <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">{firstRelation(row.profiles)?.full_name ?? "System"}</td>
                  <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{row.action}</td>
                  <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{row.metadata ? JSON.stringify(row.metadata) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalShell>
  );
}
