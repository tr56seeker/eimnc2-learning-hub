import { FormInput, FormSelect, SubmitButton } from "@/components/FormFields";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { createSectionAction, updateSectionAction } from "./actions";

type SectionRow = {
  id: string;
  name: string;
  grade_level: number;
  school_year: string;
  is_active: boolean | null;
};

type LearnerCountRow = {
  section_id: string | null;
};

function SectionForm({
  action,
  section,
  submitLabel
}: {
  action: (formData: FormData) => void;
  section?: SectionRow;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-5">
      <FormInput label="Section name" name="name" required defaultValue={section?.name} placeholder="Apollo" />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormSelect label="Grade level" name="grade_level" required defaultValue={section?.grade_level ?? ""}>
          <option value="">Select grade level</option>
          <option value="11">Grade 11</option>
          <option value="12">Grade 12</option>
        </FormSelect>
        <FormInput label="School year" name="school_year" required defaultValue={section?.school_year ?? "2026-2027"} placeholder="2026-2027" />
      </div>
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-sm font-medium text-slate-700">
        <input name="is_active" type="checkbox" defaultChecked={section?.is_active ?? true} /> Active section
      </label>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

export default async function TeacherSectionsPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const [sectionsResult, learnersResult] = await Promise.all([
    supabase.from("sections").select("id, name, grade_level, school_year, is_active").order("grade_level").order("name").returns<SectionRow[]>(),
    supabase.from("profiles").select("section_id").eq("role", "learner").returns<LearnerCountRow[]>()
  ]);

  const sections = sectionsResult.data ?? [];
  const learnerCounts = (learnersResult.data ?? []).reduce<Record<string, number>>((counts, learner) => {
    if (!learner.section_id) return counts;
    counts[learner.section_id] = (counts[learner.section_id] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Section Management" description="Create and maintain learner sections for EIM classes." />

      {params.message ? <div className="mb-7 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 font-semibold text-teal-800">{params.message}</div> : null}

      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
        <section className="card rounded-[1.75rem] p-7 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-950">Add Section</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Examples: Grade 11 - Apollo, Grade 12 - EIM.</p>
          <div className="mt-7">
            <SectionForm action={createSectionAction} submitLabel="Add Section" />
          </div>
        </section>

        <section className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Sections</h2>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">{sections.length} total</span>
          </div>
          <div className="grid gap-4">
            {sections.map((section) => (
              <details key={section.id} className="card rounded-[1.5rem] p-5 sm:p-6">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Grade {section.grade_level}</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-950">{section.name}</h3>
                      <p className="mt-2 text-sm text-slate-500">SY {section.school_year}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {learnerCounts[section.id] ?? 0} learner{(learnerCounts[section.id] ?? 0) === 1 ? "" : "s"}
                      </span>
                      <span className={section.is_active === false ? "rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700" : "rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"}>
                        {section.is_active === false ? "Inactive" : "Active"}
                      </span>
                    </div>
                  </div>
                </summary>
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <SectionForm action={updateSectionAction.bind(null, section.id)} section={section} submitLabel="Save Section" />
                </div>
              </details>
            ))}
            {!sections.length ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300/80 bg-white/70 p-10 text-center text-slate-500">
                No sections yet. Add Grade 11 - Apollo or Grade 12 - EIM to get started.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
