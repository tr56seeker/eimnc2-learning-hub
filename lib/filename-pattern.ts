export type FilenamePatternContext = {
  lrn?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  section?: string | null;
  activityTitle?: string | null;
  date?: Date;
  version?: number;
};

const TOKEN_PATTERN = /\{(LRN|FIRSTNAME|LASTNAME|FULLNAME|SECTION|ACTIVITY|DATE|VERSION)\}/g;

export const FILENAME_PATTERN_TOKENS = [
  { token: "{LRN}", description: "Learner's LRN" },
  { token: "{FIRSTNAME}", description: "Learner's first name" },
  { token: "{LASTNAME}", description: "Learner's last name" },
  { token: "{FULLNAME}", description: "Learner's full name" },
  { token: "{SECTION}", description: "Learner's section" },
  { token: "{ACTIVITY}", description: "Activity title" },
  { token: "{DATE}", description: "Submission date (YYYYMMDD)" },
  { token: "{VERSION}", description: "Submission attempt number (v1, v2, ...)" }
] as const;

function sanitizeSegment(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "_");
}

// The learner's actual file lives outside our control (Google Drive, etc.) —
// we only capture a link. This resolves what the file SHOULD be named per the
// teacher's pattern, deterministically, so a learner can't submit a
// mismatched name by mistake or by ignoring the instructions.
export function resolveFilenamePattern(pattern: string, context: FilenamePatternContext) {
  const date = context.date ?? new Date();
  const dateToken = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

  const values: Record<string, string> = {
    LRN: context.lrn ?? "",
    FIRSTNAME: context.firstName ?? "",
    LASTNAME: context.lastName ?? "",
    FULLNAME: context.fullName ?? "",
    SECTION: context.section ?? "",
    ACTIVITY: context.activityTitle ?? "",
    DATE: dateToken,
    VERSION: context.version ? `v${context.version}` : ""
  };

  const resolved = pattern.replace(TOKEN_PATTERN, (_match, token: string) => values[token] ?? "");
  return sanitizeSegment(resolved);
}
