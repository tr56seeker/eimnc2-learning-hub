import { FormInput, FormSelect, SubmitButton } from "@/components/FormFields";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { firstRelation } from "@/lib/relations";
import { createLearnerAction, updateLearnerAction } from "./actions";

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
  email: string | null;
  lrn: string | null;
  grade_level: number | null;
  section_id: string | null;
  status: string | null;
  sections: SectionRow | SectionRow[] | null;
};

function sectionLabel(section?: SectionRow) {
  if (!section) return "No section";
  return `Grade ${section.grade_level} - ${section.name}`;
}

function LearnerForm({
  action,
  sections,
  learner,
  submitLabel,
  includePassword = false
}: {
  action: (formData: FormData) => void;
  sections: SectionRow[];
  learner?: LearnerRow;
  submitLabel: string;
  includePassword?: boolean;
}) {
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <FormInput label="Full name" name="full_name" required defaultValue={learner?.full_name} />
        <FormInput label="Email" name="email" type="email" required defaultValue={learner?.email} />
      </div>
      {includePassword ? <FormInput label="Temporary password" name="password" type="password" required /> : null}
      <div className="grid gap-5 md:grid-cols-3">
        <FormInput label="LRN / Learner ID" name="lrn" defaultValue={learner?.lrn} />
        <FormSelect label="Grade level" name="grade_level" defaultValue={learner?.grade_level ?? ""}>
          <option value="">No grade level</option>
          <option value="11">Grade 11</option>
          <option value="12">Grade 12</option>
        </FormSelect>
        <FormSelect label="Status" name="status" defaultValue={learner?.status ?? "active"}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </FormSelect>
      </div>
      <FormSelect label="Section" name="section_id" defaultValue={learner?.section_id ?? ""}>
        <option value="">No section</option>
        {sections.map((section) => (
          <option key={section.id} value={section.id}>
            {sectionLabel(section)} / SY {section.school_year}
          </option>
        ))}
      </FormSelect>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
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
      .select("id, full_name, email, lrn, grade_level, section_id, status, sections(id, name, grade_level, school_year, is_active)")
      .eq("role", "learner")
      .order("full_name")
      .returns<LearnerRow[]>()
  ]);

  const sections = sectionsResult.data ?? [];
  const query = String(params.q ?? "").trim().toLowerCase();
  const sectionFilter = String(params.section_id ?? "").trim();
  const learners = (learnersResult.data ?? []).filter((learner) => {
    const section = firstRelation(learner.sections);
    const matchesSection = !sectionFilter || learner.section_id === sectionFilter;
    const searchable = [
      learner.full_name,
      learner.email,
      learner.lrn,
      learner.status,
      learner.grade_level ? `grade ${learner.grade_level}` : "",
      section?.name,
      section ? `grade ${section.grade_level}` : ""
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesSection && (!query || searchable.includes(query));
  });

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Learner Management" description="Manage learner profiles, section assignment, and account status." />

      {params.message ? <div className="mb-7 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 font-semibold text-teal-800">{params.message}</div> : null}

      <div className="grid gap-8 xl:grid-cols-[0.88fr_1.12fr]">
        <section className="card rounded-[1.75rem] p-7 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-950">Add Learner</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Creates a learner login and profile. Share the temporary password privately.</p>
          <div className="mt-7">
            <LearnerForm action={createLearnerAction} sections={sections} submitLabel="Add Learner" includePassword />
          </div>
        </section>

        <section className="grid gap-6">
          <form className="card grid gap-4 rounded-[1.75rem] p-5 sm:grid-cols-[1fr_260px_auto] sm:items-end" action="/teacher/learners">
            <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
              Search learners
              <input name="q" defaultValue={params.q ?? ""} placeholder="Name, email, LRN, or section" className="focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 font-normal shadow-sm shadow-slate-200/40" />
            </label>
            <label className="grid gap-2.5 text-sm font-semibold text-slate-700">
              Section
              <select name="section_id" defaultValue={sectionFilter} className="focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 font-normal shadow-sm shadow-slate-200/40">
                <option value="">All sections</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>{sectionLabel(section)}</option>
                ))}
              </select>
            </label>
            <button className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">
              Filter
            </button>
          </form>

          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">Learners</h2>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">{learners.length} shown</span>
            </div>
            {learners.map((learner) => {
              const section = firstRelation(learner.sections);

              return (
                <details key={learner.id} className="card rounded-[1.5rem] p-5 sm:p-6">
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{sectionLabel(section)}</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-950">{learner.full_name}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{learner.email ?? "No email recorded"}</p>
                      </div>
                      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3 md:text-right">
                        <p>LRN: {learner.lrn ?? "None"}</p>
                        <p>Grade: {learner.grade_level ?? section?.grade_level ?? "None"}</p>
                        <p className={learner.status === "inactive" ? "font-semibold text-red-600" : "font-semibold text-teal-700"}>
                          {learner.status ?? "active"}
                        </p>
                      </div>
                    </div>
                  </summary>
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <LearnerForm action={updateLearnerAction.bind(null, learner.id)} sections={sections} learner={learner} submitLabel="Save Learner" />
                  </div>
                </details>
              );
            })}
            {!learners.length ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300/80 bg-white/70 p-10 text-center text-slate-500">
                No learners match the current filters.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
