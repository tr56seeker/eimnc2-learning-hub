export const INTERNAL_LEARNER_EMAIL_DOMAIN = "eimnc2.local";

export function normalizeLearnerId(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .replace(/[\s-]+/g, "");
}

export function looksLikeLearnerId(value: string | null | undefined) {
  const normalized = normalizeLearnerId(value);
  return /^\d{6,20}$/.test(normalized);
}

export function internalLearnerEmail(lrn: string) {
  return `${normalizeLearnerId(lrn).toLowerCase()}@${INTERNAL_LEARNER_EMAIL_DOMAIN}`;
}

export function loginEmailFromIdentifier(value: string) {
  const identifier = value.trim();
  if (identifier.includes("@")) return identifier.toLowerCase();
  return looksLikeLearnerId(identifier) ? internalLearnerEmail(identifier) : identifier;
}

export function normalizeMiddleInitial(value: string | null | undefined) {
  const cleaned = String(value ?? "")
    .replace(/\./g, "")
    .trim();
  return cleaned ? `${cleaned.charAt(0).toLocaleUpperCase("en-US")}.` : null;
}

export function normalizeLearnerSuffix(value: string | null | undefined) {
  const cleaned = cleanNamePart(value).replace(/,$/, "");
  if (!cleaned) return null;
  if (/^jr\.?$/i.test(cleaned)) return "Jr.";
  if (/^sr\.?$/i.test(cleaned)) return "Sr.";
  if (/^(ii|iii|iv|v)$/i.test(cleaned)) return cleaned.toLocaleUpperCase("en-US");
  return cleaned;
}

export function buildLearnerFullName(firstName: string, middleName: string | null, lastName: string, suffix?: string | null) {
  return [firstName.trim(), cleanNamePart(middleName), lastName.trim(), normalizeLearnerSuffix(suffix)].filter(Boolean).join(" ");
}

type LearnerNameSource = {
  fullName?: string | null;
  full_name?: string | null;
  firstName?: string | null;
  first_name?: string | null;
  lastName?: string | null;
  last_name?: string | null;
  middleInitial?: string | null;
  middle_initial?: string | null;
  middleName?: string | null;
  middle_name?: string | null;
  suffix?: string | null;
};

function cleanNamePart(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function upperNamePart(value: string | null | undefined) {
  return cleanNamePart(value).toLocaleUpperCase("en-US");
}

function formattedMiddleInitial(value: string | null | undefined) {
  const cleaned = cleanNamePart(value).replace(/\./g, "");
  return cleaned ? `${cleaned.charAt(0).toLocaleUpperCase("en-US")}.` : "";
}

export function formatLearnerName(profile: LearnerNameSource | null | undefined) {
  const firstName = profile?.firstName ?? profile?.first_name ?? null;
  const lastName = profile?.lastName ?? profile?.last_name ?? null;
  const middleName = profile?.middleName ?? profile?.middle_name ?? null;
  const middleInitial = middleName || profile?.middleInitial || profile?.middle_initial || null;
  const fullName = profile?.fullName ?? profile?.full_name ?? null;
  const suffix = upperNamePart(normalizeLearnerSuffix(profile?.suffix));

  const last = upperNamePart(lastName);
  const first = upperNamePart(firstName);
  const middle = formattedMiddleInitial(middleInitial);

  if (last || first) {
    if (!last) return [first, middle, suffix].filter(Boolean).join(" ");
    if (!first) return [last, suffix].filter(Boolean).join(" ");
    return `${last}, ${[first, middle, suffix].filter(Boolean).join(" ")}`;
  }

  return cleanNamePart(fullName) || "Unnamed learner";
}

export function formatLearnerCompleteName(profile: LearnerNameSource | null | undefined) {
  const firstName = profile?.firstName ?? profile?.first_name ?? null;
  const lastName = profile?.lastName ?? profile?.last_name ?? null;
  const middleName = profile?.middleName ?? profile?.middle_name ?? null;
  const fullName = profile?.fullName ?? profile?.full_name ?? null;
  const suffix = upperNamePart(normalizeLearnerSuffix(profile?.suffix));

  const last = upperNamePart(lastName);
  const first = upperNamePart(firstName);
  const middle = upperNamePart(middleName);

  if (last || first) {
    if (!last) return [first, middle, suffix].filter(Boolean).join(" ");
    if (!first) return [last, suffix].filter(Boolean).join(" ");
    return `${last}, ${[first, middle, suffix].filter(Boolean).join(" ")}`;
  }

  return upperNamePart(fullName) || "UNNAMED LEARNER";
}

export function formatGradeSection({
  gradeLevel,
  sectionName
}: {
  gradeLevel?: string | number | null;
  sectionName?: string | null;
}) {
  const grade = cleanNamePart(gradeLevel === null || gradeLevel === undefined ? "" : String(gradeLevel));
  const section = cleanNamePart(sectionName);

  if (/^grade\s+\d+/i.test(section)) return section;
  if (grade && section) return `Grade ${grade} - ${section}`;
  if (grade) return `Grade ${grade}`;
  if (section) return section;
  return "Unassigned";
}

export function resolveLearnerLoginEmail(loginIdOrEmail: string, lrn: string | null) {
  const login = loginIdOrEmail.trim();
  if (login.includes("@")) return login.toLowerCase();

  const sourceLrn = looksLikeLearnerId(login) ? login : lrn;
  if (!sourceLrn || !looksLikeLearnerId(sourceLrn)) {
    throw new Error("Enter a real email or provide a valid numeric LRN for the internal login ID.");
  }

  return internalLearnerEmail(sourceLrn);
}
