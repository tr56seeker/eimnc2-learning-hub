import { termOptions } from "@/lib/gradebook";

type SectionOption = {
  id: string;
  name: string;
  gradeLevel: number;
  schoolYear: string;
};

type GradebookToolbarProps = {
  sections: SectionOption[];
  selectedSectionId: string;
  selectedTerm: string;
  selectedView: "detail" | "summary";
};

function tabHref(view: "detail" | "summary", selectedSectionId: string, selectedTerm: string) {
  const params = new URLSearchParams();
  params.set("view", view);
  params.set("term", selectedTerm);
  if (selectedSectionId) params.set("section_id", selectedSectionId);
  return `/teacher/gradebook?${params.toString()}`;
}

export function GradebookToolbar({ sections, selectedSectionId, selectedTerm, selectedView }: GradebookToolbarProps) {
  return (
    <section className="card rounded-[1.75rem] p-6 sm:p-7">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">EIM NC II</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Term Gradebook</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            DepEd-style term record for written/oral works, performance tasks, summative tests, and term summaries.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={tabHref("detail", selectedSectionId, selectedTerm)}
              className={selectedView === "detail" ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" : "rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-teal-700"}
            >
              Detailed Term Gradebook
            </a>
            <a
              href={tabHref("summary", selectedSectionId, selectedTerm)}
              className={selectedView === "summary" ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" : "rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-teal-700"}
            >
              Summary of Terms
            </a>
          </div>
        </div>

        <form action="/teacher/gradebook" className="grid gap-3 sm:grid-cols-[220px_220px_auto_auto] sm:items-end">
          <input type="hidden" name="view" value={selectedView} />
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Section
            <select
              name="section_id"
              defaultValue={selectedSectionId}
              className="focus-ring min-h-11 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2.5 font-normal text-slate-900 shadow-sm shadow-slate-200/40"
            >
              <option value="">All Sections</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  Grade {section.gradeLevel} - {section.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Term
            <select
              name="term"
              defaultValue={selectedTerm}
              className="focus-ring min-h-11 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2.5 font-normal text-slate-900 shadow-sm shadow-slate-200/40"
            >
              {termOptions.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </label>

          <button className="min-h-11 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">
            Apply
          </button>

          <div className="flex gap-2">
            {/* TODO: Wire this to a real Excel export generator. */}
            <button type="button" className="min-h-11 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-600">
              Export to Excel
            </button>
            {/* TODO: Wire this to a print-optimized class record layout. */}
            <button type="button" className="min-h-11 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-600">
              Print
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
