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

export function buildLearnerFullName(firstName: string, middleInitial: string | null, lastName: string) {
  return [firstName.trim(), middleInitial, lastName.trim()].filter(Boolean).join(" ");
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
