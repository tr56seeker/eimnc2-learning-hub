export type CsvColumn = { key: string; label: string };
export type CsvRow = Record<string, string | number | null | undefined>;

function escapeCsvValue(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(columns: CsvColumn[], rows: CsvRow[]) {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(",");
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvValue(String(row[column.key] ?? ""))).join(",")
  );
  return [header, ...lines].join("\r\n");
}
