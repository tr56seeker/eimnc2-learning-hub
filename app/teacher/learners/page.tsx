import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { firstRelation } from "@/lib/relations";
import { LearnersManagementClient } from "./LearnersManagementClient";
import type { LearnerListItem, SectionOption } from "./types";

type SectionRow = {
  id: string;
  name: string;
  grade_level: string | number;
  school_year: string;
  is_active: boolean | null;
};

type LearnerRow = {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  middle_initial: string | null;
  email: string | null;
  lrn: string | null;
  grade_level: string | number | null;
  section_id: string | null;
  status: "active" | "inactive" | null;
  must_change_password: boolean | null;
  sections: SectionRow | SectionRow[] | null;
};

function sectionLabel(section?: SectionRow | null) {
  if (!section) return "No section";
  return `Grade ${section.grade_level} - ${section.name}`;
}

function bestEffortNameParts(fullName: string) {
  const cleaned = fullName.replace(/\s+/g, " ").trim();
  if (!cleaned) return { firstName: "", lastName: "", middleInitial: null };

  if (cleaned.includes(",")) {
    const [last, ...givenParts] = cleaned.split(",");
    const givenTokens = givenParts.join(",").trim().split(" ").filter(Boolean);
    const middle = givenTokens.length > 1 ? givenTokens.at(-1) ?? null : null;
    const first = givenTokens.length > 1 ? givenTokens.slice(0, -1).join(" ") : givenTokens.join(" ");
    return { firstName: first, lastName: last.trim(), middleInitial: middle };
  }

  const tokens = cleaned.split(" ").filter(Boolean);
  if (tokens.length === 1) return { firstName: tokens[0], lastName: "", middleInitial: null };
  if (tokens.length === 2) return { firstName: tokens[0], lastName: tokens[1], middleInitial: null };

  return {
    firstName: tokens.slice(0, -2).join(" ") || tokens[0],
    middleInitial: tokens.at(-2) ?? null,
    lastName: tokens.at(-1) ?? ""
  };
}

export default async function TeacherLearnersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; section_id?: string; message?: string }>;
}) {
  const params = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const [sectionsResult, learnersResult] = await Promise.all([
    supabase.from("sections").select("id, name, grade_level, school_year, is_active").order("grade_level").order("name").returns<SectionRow[]>(),
    supabase
      .from("profiles")
      .select("id, full_name, first_name, last_name, middle_initial, email, lrn, grade_level, section_id, status, must_change_password, sections(id, name, grade_level, school_year, is_active)")
      .eq("role", "learner")
      .order("last_name", { nullsFirst: false })
      .order("first_name", { nullsFirst: false })
      .order("full_name")
      .returns<LearnerRow[]>()
  ]);

  const sections: SectionOption[] = (sectionsResult.data ?? []).map((section) => ({
    id: section.id,
    name: section.name,
    grade_level: section.grade_level,
    school_year: section.school_year,
    is_active: section.is_active
  }));

  const query = String(params.q ?? "").trim().toLowerCase();
  const sectionFilter = String(params.section_id ?? "").trim();

  const learners: LearnerListItem[] = (learnersResult.data ?? [])
    .map((learner) => {
      const section = firstRelation(learner.sections);
      const inferred = bestEffortNameParts(learner.full_name);
      const firstName = learner.first_name ?? inferred.firstName;
      const lastName = learner.last_name ?? inferred.lastName;
      const middleInitial = learner.middle_initial ?? inferred.middleInitial;

      return {
        id: learner.id,
        fullName: learner.full_name,
        firstName,
        lastName,
        middleInitial,
        lrn: learner.lrn,
        loginId: learner.email,
        gradeLevel: learner.grade_level,
        sectionId: learner.section_id,
        sectionName: sectionLabel(section),
        status: learner.status ?? "active",
        mustChangePassword: Boolean(learner.must_change_password ?? false)
      };
    })
    .filter((learner) => {
      const matchesSection = !sectionFilter || learner.sectionId === sectionFilter;
      const searchable = [
        learner.fullName,
        learner.firstName,
        learner.lastName,
        learner.middleInitial,
        learner.loginId,
        learner.lrn,
        learner.status,
        learner.gradeLevel ? `grade ${learner.gradeLevel}` : "",
        learner.sectionName
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesSection && (!query || searchable.includes(query));
    });

  return (
    <PortalShell profile={profile}>
      <SectionHeader
        eyebrow="Teacher"
        title="Learners"
        description="Enroll, manage, and assign EIM learners to their sections."
      />

      {params.message ? (
        <div className="mb-7 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 font-semibold text-teal-800">
          {params.message}
        </div>
      ) : null}

      <form className="card mb-7 grid gap-4 rounded-[1.75rem] p-5 sm:grid-cols-[1fr_260px_auto] sm:items-end" action="/teacher/learners">
        <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
          Search learners
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Name, email, LRN, or section"
            className="focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 font-normal shadow-sm shadow-slate-200/40"
          />
        </label>
        <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
          Section
          <select
            name="section_id"
            defaultValue={sectionFilter}
            className="focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 font-normal shadow-sm shadow-slate-200/40"
          >
            <option value="">All sections</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {sectionLabel(section)}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">
          Filter
        </button>
      </form>

      <LearnersManagementClient learners={learners} sections={sections} />
    </PortalShell>
  );
}
