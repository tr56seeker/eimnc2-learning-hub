import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { FlashMessage } from "@/components/FlashMessage";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { onlineBadgeClass, statusBadgeClass } from "@/lib/badges";
import { requireTeacher } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { formatGradeSection, formatLearnerCompleteName, formatLearnerName } from "@/lib/learner-accounts";
import { calculateAge, getOnlineStatus } from "@/lib/presence";
import { firstRelation } from "@/lib/relations";
import type { ProfileStatus } from "@/lib/types";
import { grantExamRetakeAction } from "../actions";
import { ProfileDangerActions } from "./ProfileDangerActions";

type SectionRow = {
  id: string;
  name: string;
  grade_level: string | number;
  school_year: string;
  is_active: boolean | null;
};

type LearnerProfileRow = {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  middle_initial?: string | null;
  middle_name?: string | null;
  suffix?: string | null;
  sex?: string | null;
  birthdate?: string | null;
  last_seen_at?: string | null;
  email?: string | null;
  lrn: string | null;
  grade_level?: string | number | null;
  section_id: string | null;
  role: string;
  status: ProfileStatus | null;
  must_change_password?: boolean | null;
  created_at: string | null;
  sections: SectionRow | SectionRow[] | null;
};

type ExamAttemptRow = {
  id: string;
  exam_id: string;
  score: number | null;
  max_score: number | null;
  status: string;
  submitted_at: string | null;
  started_at: string | null;
  violation_count: number | null;
  termination_reason: string | null;
  exams: { title: string } | { title: string }[] | null;
};

type SubmissionRow = {
  id: string;
  status: string;
  score: number | null;
  feedback: string | null;
  submitted_at: string | null;
  assignments: { title: string; max_score: number | null } | { title: string; max_score: number | null }[] | null;
};

type GradeRow = {
  id: string;
  title: string;
  score: number | null;
  max_score: number | null;
  component: string;
  created_at: string | null;
};

type GradebookScoreRow = {
  id: string;
  score: number | null;
  gradebook_assessments:
    | { label: string; term: string; category: string; highest_possible: number | null }
    | { label: string; term: string; category: string; highest_possible: number | null }[]
    | null;
};

function sectionLabel(section?: SectionRow | null) {
  if (!section) return "No section assigned";
  return `Grade ${section.grade_level} - ${section.name}`;
}

function formatBirthdate(value: string | null | undefined) {
  if (!value) return "Not set";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "long" }).format(new Date(year, month - 1, day));
}

function scoreLabel(score: number | null | undefined, maxScore: number | null | undefined) {
  if (score === null || score === undefined) return "Not scored";
  return maxScore ? `${score} / ${maxScore}` : String(score);
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-950">{value || "Not set"}</dd>
    </div>
  );
}

export default async function TeacherLearnerProfilePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const richLearnerResult = await supabase
    .from("profiles")
    .select("id, full_name, first_name, last_name, middle_name, middle_initial, suffix, sex, birthdate, last_seen_at, email, lrn, grade_level, section_id, role, status, must_change_password, created_at, sections(id, name, grade_level, school_year, is_active)")
    .eq("id", id)
    .eq("role", "learner")
    .maybeSingle<LearnerProfileRow>();

  // Avoid a false 404 when the deployed database has the core profile but a
  // newly added optional learner-management column has not reached its schema
  // cache yet. The core lookup still verifies both the id and learner role.
  const learnerResult = richLearnerResult.error
    ? await supabase
        .from("profiles")
        .select("id, full_name, lrn, section_id, role, status, created_at, sections(id, name, grade_level, school_year, is_active)")
        .eq("id", id)
        .eq("role", "learner")
        .maybeSingle<LearnerProfileRow>()
    : richLearnerResult;

  if (!learnerResult.data) {
    notFound();
  }

  const learner = learnerResult.data;
  const formalName = formatLearnerName({
    full_name: learner.full_name,
    first_name: learner.first_name,
    last_name: learner.last_name,
    middle_name: learner.middle_name,
    middle_initial: learner.middle_initial,
    suffix: learner.suffix
  });
  const completeName = formatLearnerCompleteName({
    full_name: learner.full_name,
    first_name: learner.first_name,
    last_name: learner.last_name,
    middle_name: learner.middle_name,
    suffix: learner.suffix
  });
  const onlineStatus = getOnlineStatus(learner.last_seen_at);
  const age = calculateAge(learner.birthdate);
  const section = firstRelation(learner.sections);
  const gradeSection = formatGradeSection({ gradeLevel: learner.grade_level, sectionName: section?.name });

  const [attemptsResult, submissionsResult, gradesResult, gradebookResult, retakeGrantsResult] = await Promise.all([
    supabase
      .from("exam_attempts")
      .select("id, exam_id, score, max_score, status, submitted_at, started_at, violation_count, termination_reason, exams(title)")
      .eq("learner_id", id)
      .order("started_at", { ascending: false })
      .limit(5)
      .returns<ExamAttemptRow[]>(),
    supabase
      .from("submissions")
      .select("id, status, score, feedback, submitted_at, assignments(title, max_score)")
      .eq("learner_id", id)
      .order("submitted_at", { ascending: false })
      .limit(5)
      .returns<SubmissionRow[]>(),
    supabase
      .from("grades")
      .select("id, title, score, max_score, component, created_at")
      .eq("learner_id", id)
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<GradeRow[]>(),
    supabase
      .from("gradebook_scores")
      .select("id, score, gradebook_assessments(label, term, category, highest_possible)")
      .eq("learner_id", id)
      .limit(6)
      .returns<GradebookScoreRow[]>(),
    supabase
      .from("exam_retake_grants")
      .select("exam_id")
      .eq("learner_id", id)
      .eq("used", false)
  ]);

  const pendingRetakeExamIds = new Set((retakeGrantsResult.data ?? []).map((grant) => grant.exam_id));

  const attempts = attemptsResult.data ?? [];
  const submissions = submissionsResult.data ?? [];
  const grades = gradesResult.data ?? [];
  const gradebookScores = gradebookResult.data ?? [];

  return (
    <PortalShell profile={profile}>
      <Link href="/teacher/learners" className="mb-6 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-teal-200 hover:text-teal-700">
        Back to learners
      </Link>

      <SectionHeader eyebrow="Learner Profile" title={learner.full_name} description="Profile, demographics, account activity, and learning records." />

      <FlashMessage message={query.error} variant="error" className="mb-7" />
      <FlashMessage message={query.message} variant="success" className="mb-7" />

      <div className="grid gap-7">
        <section className="card rounded-[1.75rem] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">{formalName}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{completeName}</h2>
              <p className="mt-2 text-slate-500">{sectionLabel(section)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={onlineBadgeClass(onlineStatus)}>{onlineStatus.charAt(0).toUpperCase() + onlineStatus.slice(1)}</span>
              <span className={statusBadgeClass(learner.status)}>{learner.status ?? "active"}</span>
            </div>
          </div>

          <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem label="LRN" value={learner.lrn} />
            <DetailItem label="Login ID / Email" value={learner.email} />
            <DetailItem label="Grade Level" value={learner.grade_level ? `Grade ${learner.grade_level}` : null} />
            <DetailItem label="Role" value={learner.role} />
            <DetailItem label="Created" value={formatDateTime(learner.created_at)} />
            <DetailItem label="Password Change" value={learner.must_change_password ? "Required" : "Not required"} />
            <DetailItem label="Section" value={section?.name ?? null} />
            <DetailItem label="School Year" value={section?.school_year ?? null} />
            <DetailItem label="Grade & Section" value={gradeSection} />
            <DetailItem label="Sex" value={learner.sex ?? "Not specified"} />
            <DetailItem label="Birthday" value={formatBirthdate(learner.birthdate)} />
            <DetailItem label="Age" value={age === null ? "Not set" : String(age)} />
            <DetailItem label="Online Status" value={onlineStatus.charAt(0).toUpperCase() + onlineStatus.slice(1)} />
            <DetailItem label="Last Seen" value={learner.last_seen_at ? formatDateTime(learner.last_seen_at) : "No recent activity"} />
            <DetailItem label="Account Status" value={learner.status ?? "active"} />
          </dl>
        </section>

        <section className="grid gap-7 lg:grid-cols-2">
          <div className="card rounded-[1.75rem] p-6">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Recent Exam Attempts</h2>
            {attempts.length ? (
              <div className="mt-5 grid gap-3">
                {attempts.map((attempt) => {
                  const exam = firstRelation(attempt.exams);
                  return (
                    <div key={attempt.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                      <p className="font-semibold text-slate-950">{exam?.title ?? "Exam"}</p>
                      <p className="mt-1 text-sm text-slate-500">{attempt.status} / {scoreLabel(attempt.score, attempt.max_score)}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{formatDateTime(attempt.submitted_at ?? attempt.started_at)}</p>
                      {attempt.termination_reason ? (
                        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium leading-5 text-red-700">
                          ⚠️ Ended early ({attempt.violation_count ?? 0} violations): {attempt.termination_reason}
                        </p>
                      ) : null}
                      {attempt.status === "submitted" ? (
                        pendingRetakeExamIds.has(attempt.exam_id) ? (
                          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                            Retake approved — waiting for learner to attempt again.
                          </p>
                        ) : (
                          <form action={grantExamRetakeAction.bind(null, id)} className="mt-3 flex flex-wrap items-center gap-2">
                            <input type="hidden" name="exam_id" value={attempt.exam_id} />
                            <input
                              name="note"
                              placeholder="Optional note (e.g. remediation reason)"
                              className="focus-ring min-w-[220px] flex-1 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 text-xs"
                            />
                            <button className="rounded-xl bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800">
                              Grant Retake
                            </button>
                          </form>
                        )
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5"><EmptyState title="No exam attempts" message="Recent exam attempts will appear here after the learner starts or submits an exam." /></div>
            )}
          </div>

          <div className="card rounded-[1.75rem] p-6">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Recent Submissions</h2>
            {submissions.length ? (
              <div className="mt-5 grid gap-3">
                {submissions.map((submission) => {
                  const assignment = firstRelation(submission.assignments);
                  return (
                    <div key={submission.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                      <p className="font-semibold text-slate-950">{assignment?.title ?? "Submission"}</p>
                      <p className="mt-1 text-sm text-slate-500">{submission.status} / {scoreLabel(submission.score, assignment?.max_score)}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{formatDateTime(submission.submitted_at)}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5"><EmptyState title="No submissions" message="Submitted assignment work will appear here." /></div>
            )}
          </div>
        </section>

        <section className="card rounded-[1.75rem] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Grade Summary</h2>
          {grades.length || gradebookScores.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {grades.map((grade) => (
                <div key={grade.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                  <p className="font-semibold text-slate-950">{grade.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{grade.component} / {scoreLabel(grade.score, grade.max_score)}</p>
                </div>
              ))}
              {gradebookScores.map((row) => {
                const assessment = firstRelation(row.gradebook_assessments);
                return (
                  <div key={row.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                    <p className="font-semibold text-slate-950">{assessment ? `${assessment.term} - ${assessment.label}` : "Gradebook score"}</p>
                    <p className="mt-1 text-sm text-slate-500">{assessment?.category ?? "gradebook"} / {scoreLabel(row.score, assessment?.highest_possible)}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-5"><EmptyState title="No grades yet" message="Exam, submission, or gradebook scores will appear here when available." /></div>
          )}
        </section>

        <section className="card rounded-[1.75rem] border-red-100 p-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Danger Zone</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Deactivation blocks learner access through profile status. Delete uses a soft delete and preserves learner records by setting status to deleted.
          </p>
          <div className="mt-5">
            <ProfileDangerActions learnerId={learner.id} status={learner.status} />
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
