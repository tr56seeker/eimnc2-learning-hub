import { addGradebookAssessmentAction } from "@/app/teacher/gradebook/actions";
import { GradebookToolbar } from "@/components/gradebook/GradebookToolbar";
import { TermGradebookMatrix } from "@/components/gradebook/TermGradebookMatrix";
import { TermSummaryTable } from "@/components/gradebook/TermSummaryTable";
import { EmptyState } from "@/components/EmptyState";
import { PortalShell } from "@/components/PortalShell";
import { requireTeacher } from "@/lib/auth";
import {
  categoryComputed,
  gradebookWeights,
  initialGrade,
  isGradebookTerm,
  termAverage,
  termOptions,
  termRemarks,
  transmutedGrade,
  type EditableGradebookAssessment,
  type EditableGradebookScore,
  type EditableLearner,
  type GradebookCell,
  type GradebookTerm,
  type TermSummaryRow
} from "@/lib/gradebook";
import { formatLearnerName } from "@/lib/learner-accounts";
import { firstRelation } from "@/lib/relations";

type SectionRow = {
  id: string;
  name: string;
  grade_level: number;
  school_year: string;
  is_active: boolean | null;
};

type LearnerRow = {
  id: string;
  full_name: string;
  first_name: string | null;
  middle_name: string | null;
  middle_initial: string | null;
  last_name: string | null;
  suffix: string | null;
  lrn: string | null;
  section_id: string | null;
  sections: SectionRow | SectionRow[] | null;
};

type AssessmentRow = {
  id: string;
  term: string;
  category: "written" | "performance" | "summative" | "term_exam";
  label: string;
  highest_possible: number | null;
  display_order: number | null;
  is_active: boolean | null;
};

type ScoreRow = {
  assessment_id: string;
  learner_id: string;
  score: number | null;
};

type SectionOption = {
  id: string;
  name: string;
  gradeLevel: number;
  schoolYear: string;
};

const defaultAssessmentTemplates = [
  ...Array.from({ length: 5 }, (_, index) => ({ category: "written", label: String(index + 1), display_order: index + 1 })),
  ...Array.from({ length: 3 }, (_, index) => ({ category: "performance", label: String(index + 1), display_order: index + 1 })),
  { category: "summative", label: "SA1", display_order: 1 },
  { category: "summative", label: "SA2", display_order: 2 },
  { category: "term_exam", label: "TE", display_order: 99 }
] as const;

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function sectionLabel(section?: SectionRow) {
  return section ? `Grade ${section.grade_level} - ${section.name}` : null;
}

function toClientAssessment(row: AssessmentRow): EditableGradebookAssessment {
  return {
    id: row.id,
    term: row.term,
    category: row.category,
    label: row.label,
    highestPossible: toNumber(row.highest_possible),
    displayOrder: Number(row.display_order ?? 0),
    isActive: row.is_active ?? true
  };
}

async function ensureDefaultAssessments({
  supabase,
  term,
  sectionId
}: {
  supabase: Awaited<ReturnType<typeof requireTeacher>>["supabase"];
  term: GradebookTerm;
  sectionId: string | null;
}) {
  const query = supabase
    .from("gradebook_assessments")
    .select("category, label")
    .eq("term", term);

  const { data: existing } = sectionId ? await query.eq("section_id", sectionId) : await query.is("section_id", null);
  const existingKeys = new Set((existing ?? []).map((row) => `${row.category}:${row.label}`));
  const missingRows = defaultAssessmentTemplates
    .filter((template) => !existingKeys.has(`${template.category}:${template.label}`))
    .map((template) => ({
      term,
      category: template.category,
      label: template.label,
      highest_possible: 0,
      display_order: template.display_order,
      section_id: sectionId,
      is_active: true,
      updated_at: new Date().toISOString()
    }));

  if (missingRows.length) {
    await supabase.from("gradebook_assessments").insert(missingRows);
  }
}

function scoreMapFor(scores: ScoreRow[]) {
  return new Map(scores.map((score) => [`${score.assessment_id}:${score.learner_id}`, toNumber(score.score)]));
}

function computeTermGrade(learnerId: string, assessments: EditableGradebookAssessment[], scoreMap: Map<string, number | null>) {
  const byCategory = {
    written: assessments.filter((assessment) => assessment.category === "written"),
    performance: assessments.filter((assessment) => assessment.category === "performance"),
    exam: assessments.filter((assessment) => assessment.category === "summative" || assessment.category === "term_exam")
  };

  function categoryScore(categoryAssessments: EditableGradebookAssessment[], weight: number) {
    const cells: GradebookCell[] = categoryAssessments.map((assessment) => ({
      score: scoreMap.get(`${assessment.id}:${learnerId}`) ?? null,
      maxScore: assessment.highestPossible,
      title: assessment.label
    }));
    const hpsTotal = categoryAssessments.reduce((sum, assessment) => sum + (assessment.highestPossible ?? 0), 0);
    return categoryComputed(cells, hpsTotal, weight);
  }

  const written = categoryScore(byCategory.written, gradebookWeights.written);
  const performance = categoryScore(byCategory.performance, gradebookWeights.performance);
  const exam = categoryScore(byCategory.exam, gradebookWeights.exam);
  return transmutedGrade(initialGrade(written.ws, performance.ws, exam.ws));
}

function AddAssessmentButtons({ term, sectionId }: { term: string; sectionId: string }) {
  const buttons = [
    ["written", "Add Written / Oral Work"],
    ["performance", "Add Performance Task"],
    ["summative", "Add Summative Assessment"]
  ];

  return (
    <section className="card flex flex-wrap items-center gap-3 rounded-[1.5rem] p-4">
      {buttons.map(([category, label]) => (
        <form key={category} action={addGradebookAssessmentAction}>
          <input type="hidden" name="term" value={term} />
          <input type="hidden" name="section_id" value={sectionId} />
          <input type="hidden" name="category" value={category} />
          <button className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-teal-200 hover:text-teal-700">
            {label}
          </button>
        </form>
      ))}
      <p className="text-sm text-slate-500">TE is always kept as the Term Examination column.</p>
    </section>
  );
}

export default async function TeacherGradebookPage({
  searchParams
}: {
  searchParams: Promise<{ section_id?: string; term?: string; view?: string }>;
}) {
  const params = await searchParams;
  const selectedSectionId = String(params.section_id ?? "");
  const selectedTerm = isGradebookTerm(String(params.term ?? "")) ? String(params.term) as GradebookTerm : "First Term";
  const selectedView = params.view === "summary" ? "summary" : "detail";
  const { profile, supabase } = await requireTeacher();
  const sectionIdForGradebook = selectedSectionId || null;

  await ensureDefaultAssessments({ supabase, term: selectedTerm, sectionId: sectionIdForGradebook });

  let learnersQuery = supabase
    .from("profiles")
    .select("id, full_name, first_name, middle_name, middle_initial, last_name, suffix, lrn, section_id, sections(id, name, grade_level, school_year)")
    .eq("role", "learner");

  if (selectedSectionId) {
    learnersQuery = learnersQuery.eq("section_id", selectedSectionId);
  }

  const selectedAssessmentQuery = supabase
    .from("gradebook_assessments")
    .select("id, term, category, label, highest_possible, display_order, is_active")
    .eq("term", selectedTerm)
    .eq("is_active", true);

  const allTermAssessmentQuery = supabase
    .from("gradebook_assessments")
    .select("id, term, category, label, highest_possible, display_order, is_active")
    .in("term", [...termOptions])
    .eq("is_active", true);

  const [sectionsResult, learnersResult, selectedAssessmentsResult, allTermAssessmentsResult] = await Promise.all([
    supabase.from("sections").select("id, name, grade_level, school_year, is_active").order("grade_level").order("name").returns<SectionRow[]>(),
    learnersQuery.order("full_name").returns<LearnerRow[]>(),
    sectionIdForGradebook
      ? selectedAssessmentQuery.eq("section_id", sectionIdForGradebook).order("category").order("display_order").returns<AssessmentRow[]>()
      : selectedAssessmentQuery.is("section_id", null).order("category").order("display_order").returns<AssessmentRow[]>(),
    sectionIdForGradebook
      ? allTermAssessmentQuery.eq("section_id", sectionIdForGradebook).order("term").order("category").order("display_order").returns<AssessmentRow[]>()
      : allTermAssessmentQuery.is("section_id", null).order("term").order("category").order("display_order").returns<AssessmentRow[]>()
  ]);

  const learners = learnersResult.data ?? [];
  const learnerIds = new Set(learners.map((learner) => learner.id));
  const sections: SectionOption[] = (sectionsResult.data ?? []).map((section) => ({
    id: section.id,
    name: section.name,
    gradeLevel: section.grade_level,
    schoolYear: section.school_year
  })).filter((section) => {
    const source = (sectionsResult.data ?? []).find((row) => row.id === section.id);
    return source?.is_active !== false || section.id === selectedSectionId;
  });
  const selectedAssessments = (selectedAssessmentsResult.data ?? []).map(toClientAssessment);
  const allTermAssessments = (allTermAssessmentsResult.data ?? []).map(toClientAssessment);
  const assessmentIds = new Set([...selectedAssessments, ...allTermAssessments].map((assessment) => assessment.id));

  const { data: scoreRows } = assessmentIds.size
    ? await supabase
        .from("gradebook_scores")
        .select("assessment_id, learner_id, score")
        .in("assessment_id", [...assessmentIds])
        .returns<ScoreRow[]>()
    : { data: [] as ScoreRow[] };

  const filteredScores = (scoreRows ?? []).filter((score) => learnerIds.has(score.learner_id));
  const scoreMap = scoreMapFor(filteredScores);

  const editableLearners: EditableLearner[] = learners.map((learner, index) => {
    const section = firstRelation(learner.sections);
    return {
      id: learner.id,
      rowNumber: index + 1,
      fullName: formatLearnerName({
        fullName: learner.full_name,
        firstName: learner.first_name,
        middleName: learner.middle_name ?? learner.middle_initial,
        lastName: learner.last_name,
        suffix: learner.suffix
      }),
      lrn: learner.lrn,
      sectionName: sectionLabel(section)
    };
  });

  const selectedScores: EditableGradebookScore[] = filteredScores
    .filter((score) => selectedAssessments.some((assessment) => assessment.id === score.assessment_id))
    .map((score) => ({
      assessmentId: score.assessment_id,
      learnerId: score.learner_id,
      score: toNumber(score.score)
    }));

  const assessmentsByTerm = new Map<string, EditableGradebookAssessment[]>();
  for (const assessment of allTermAssessments) {
    assessmentsByTerm.set(assessment.term, [...(assessmentsByTerm.get(assessment.term) ?? []), assessment]);
  }

  const summaryRows: TermSummaryRow[] = editableLearners.map((learner) => {
    const firstTerm = computeTermGrade(learner.id, assessmentsByTerm.get("First Term") ?? [], scoreMap);
    const secondTerm = computeTermGrade(learner.id, assessmentsByTerm.get("Second Term") ?? [], scoreMap);
    const thirdTerm = computeTermGrade(learner.id, assessmentsByTerm.get("Third Term") ?? [], scoreMap);
    const average = termAverage([firstTerm, secondTerm, thirdTerm]);

    return {
      learnerId: learner.id,
      rowNumber: learner.rowNumber,
      fullName: learner.fullName,
      lrn: learner.lrn,
      sectionName: learner.sectionName,
      firstTerm,
      secondTerm,
      thirdTerm,
      average,
      remarks: termRemarks(average)
    };
  });

  return (
    <PortalShell profile={profile}>
      <div className="grid gap-7">
        <GradebookToolbar sections={sections} selectedSectionId={selectedSectionId} selectedTerm={selectedTerm} selectedView={selectedView} />

        {selectedView === "detail" ? <AddAssessmentButtons term={selectedTerm} sectionId={selectedSectionId} /> : null}

        {!learners.length ? (
          <EmptyState title="No learners found" message="Add learners or choose another section to populate the term class record." />
        ) : selectedView === "summary" ? (
          <TermSummaryTable rows={summaryRows} />
        ) : (
          <TermGradebookMatrix learners={editableLearners} assessments={selectedAssessments} scores={selectedScores} />
        )}

        <p className="text-sm leading-6 text-slate-500">
          Term Gradebook scores are saved to editable assessment columns. Export to Excel and Print are placeholders for a future reporting sprint.
        </p>
      </div>
    </PortalShell>
  );
}
