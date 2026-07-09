export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila"
  }).format(new Date(value));
}

export function percent(score: number | null | undefined, maxScore: number | null | undefined) {
  if (!score || !maxScore) return 0;
  return Math.round((score / maxScore) * 100);
}
