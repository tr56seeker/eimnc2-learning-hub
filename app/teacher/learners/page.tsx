import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import type { ProfileStatus } from "@/lib/types";
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
  status: ProfileStatus | null;
  must_change_password?: boolean | null;
};

function sectionLabel(section?: SectionRow | null) {
  if (!section) return "Unassigned";
  return `Grade ${section.grade_level} - ${section.name}`;
}

function normalizedFilter(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = String(raw ?? "").trim();
  return normalized && normalized !== "all" ? normalized : "";
}

function normalizedStatusFilter(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = String(raw ?? "").trim().toLowerCase();

  if (normalized === "all") return "all";
  if (normalized === "inactive" || normalized === "deleted") return normalized;
  return "active";
}

function normalizeLearnerStatus(status: string | null | undefined): ProfileStatus {
  if (status === "inactive" || status === "deleted") return status;
  return "active";
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
  searchParams: Promise<{ q?: string; section_id?: string; status?: string; message?: string }>;
}) {
  const params = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const [sectionsResult, richLearnersResult] = await Promise.all([
    supabase.from("sections").select("id, name, grade_level, school_year, is_active").order("grade_level").order("name").returns<SectionRow[]>(),
    supabase
      .from("profiles")
      .select("id, full_name, first_name, last_name, middle_name, middle_initial, suffix, sex, birthdate, last_seen_at, email, lrn, grade_level, section_id, status, must_change_password")
      .eq("role", "learner")
      .order("last_name", { nullsFirst: false })
      .order("first_name", { nullsFirst: false })
      .order("middle_name", { nullsFirst: false })
      .order("suffix", { nullsFirst: false })
      .order("full_name")
      .returns<LearnerRow[]>()
  ]);

  // Some deployed databases have the core learner columns but not the newer
  // name/password-management columns yet. A missing optional column makes
  // PostgREST reject the entire select, so retry with the compatible profile
  // shape instead of turning that query error into an empty learner list.
  const learnersResult = richLearnersResult.error
    ? await supabase
        .from("profiles")
        .select("id, full_name, lrn, section_id, status")
        .eq("role", "learner")
        .order("full_name")
        .returns<LearnerRow[]>()
    : richLearnersResult;

  const sections: SectionOption[] = (sectionsResult.data ?? []).map((section) => ({
    id: section.id,
    name: section.name,
    grade_level: section.grade_level,
    school_year: section.school_year,
    is_active: section.is_active
  }));
  const sectionById = new Map((sectionsResult.data ?? []).map((section) => [section.id, section]));

  const query = normalizedFilter(params.q).toLowerCase();
  const sectionFilter = normalizedFilter(params.section_id);
  const statusFilter = normalizedStatusFilter(params.status);
  const rawLearners = learnersResult.data ?? [];

  if (process.env.NODE_ENV !== "production") {
    console.info("[teacher/learners] filters", {
      hasSearch: Boolean(query),
      sectionFilter: sectionFilter || "all",
      statusFilter,
      fetchedLearners: rawLearners.length,
      queryError: learnersResult.error?.message ?? null
    });
  }

  const learners: LearnerListItem[] = rawLearners
    .map((learner) => {
      const section = learner.section_id ? sectionById.get(learner.section_id) ?? null : null;
      const inferred = bestEffortNameParts(learner.full_name);
      const firstName = learner.first_name ?? inferred.firstName;
      const lastName = learner.last_name ?? inferred.lastName;
      const middleInitial = learner.middle_initial ?? inferred.middleInitial;
      const status = normalizeLearnerStatus(learner.status);

      return {
        id: learner.id,
        fullName: learner.full_name,
        firstName,
        lastName,
        middleInitial,
        middleName: learner.middle_name ?? null,
        suffix: learner.suffix ?? null,
        sex: learner.sex ?? null,
        birthdate: learner.birthdate ?? null,
        lastSeenAt: learner.last_seen_at ?? null,
        lrn: learner.lrn,
        loginId: learner.email?.trim() || (learner.lrn ? `${learner.lrn}@eimnc2.local` : ""),
        gradeLevel: learner.grade_level ?? null,
        sectionId: learner.section_id,
        sectionName: sectionLabel(section),
        status,
        mustChangePassword: Boolean(learner.must_change_password ?? false)
      };
    })
    .filter((learner) => {
      const matchesSection = !sectionFilter || learner.sectionId === sectionFilter;
      const matchesStatus = statusFilter === "all" || learner.status === statusFilter;
      const searchable = [
        learner.fullName,
        learner.firstName,
        learner.lastName,
        learner.middleInitial,
        learner.loginId,
        learner.lrn,
        learner.status,
        learner.sex,
        learner.gradeLevel ? `grade ${learner.gradeLevel}` : "",
        learner.sectionName
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesSection && matchesStatus && (!query || searchable.includes(query));
    });

  return (
    <PortalShell profile={profile}>
      <SectionHeader
        eyebrow="Teacher"
        title="Learners"
        description="Enroll, view, and manage EIM learners."
      />

      {params.message ? (
        <div className="mb-7 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 font-semibold text-teal-800">
          {params.message}
        </div>
      ) : null}

      <form className="card mb-7 grid gap-4 rounded-[1.75rem] p-5 sm:grid-cols-[1fr_220px_180px_auto] sm:items-end" action="/teacher/learners">
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
        <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
          Status
          <select
            name="status"
            defaultValue={statusFilter}
            className="focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 font-normal shadow-sm shadow-slate-200/40"
          >
            <option value="active">Active learners</option>
            <option value="all">All statuses</option>
            <option value="inactive">Inactive</option>
            <option value="deleted">Deleted</option>
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
