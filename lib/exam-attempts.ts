export type SubmittedAttemptRow = {
  id: string;
  learner_id: string;
  submitted_at: string | null;
};

/**
 * A learner can have more than one submitted attempt for the same exam
 * after a teacher-approved retake. Only the most recent attempt should
 * count toward any aggregate report or grading workflow, matching the same
 * "latest attempt wins" rule applied to the learner's own grade.
 */
export function latestAttemptPerLearner<T extends SubmittedAttemptRow>(attempts: T[]): T[] {
  const latest = new Map<string, T>();
  for (const attempt of attempts) {
    const existing = latest.get(attempt.learner_id);
    if (!existing || (attempt.submitted_at ?? "") > (existing.submitted_at ?? "")) {
      latest.set(attempt.learner_id, attempt);
    }
  }
  return [...latest.values()];
}
