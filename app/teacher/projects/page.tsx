import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { FlashMessage } from "@/components/FlashMessage";
import { FormInput, FormSelect, FormTextarea, SubmitButton } from "@/components/FormFields";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { firstRelation } from "@/lib/relations";
import { createProjectAction } from "./actions";

type ProjectRow = {
  id: string;
  title: string;
  due_at: string | null;
  is_active: boolean | null;
  competencies: { code: string | null; title: string | null } | { code: string | null; title: string | null }[] | null;
  project_assignments: { status: string }[] | null;
};

function normalizeStatusFilter(value: string | undefined) {
  return value === "archived" || value === "all" ? value : "active";
}

export default async function TeacherProjectsPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string; status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = normalizeStatusFilter(params.status);
  const { profile, supabase } = await requireTeacher();

  const [projectsResult, competenciesResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, due_at, is_active, competencies(code, title), project_assignments(status)")
      .order("due_at", { ascending: true })
      .returns<ProjectRow[]>(),
    supabase.from("competencies").select("id, code, title").eq("is_active", true).order("order_index")
  ]);

  const competencies = competenciesResult.data ?? [];
  const projects = (projectsResult.data ?? []).filter(
    (project) => statusFilter === "all" || (statusFilter === "active" ? project.is_active !== false : project.is_active === false)
  );

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Projects" description="Assign performance-task projects with milestones learners submit evidence against." />

      <FlashMessage message={params.error} variant="error" className="mb-7" />
      <FlashMessage message={params.message} variant="success" className="mb-7" />

      <div className="grid gap-8 xl:grid-cols-[0.75fr_1.25fr]">
        <section className="card rounded-[1.75rem] p-7 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">Create Project</h2>
          <form action={createProjectAction} className="mt-6 grid gap-5">
            <FormInput label="Title" name="title" required placeholder="Residential Wiring Layout" />
            <FormTextarea label="Overview" name="overview" placeholder="What is this project about?" />
            <FormSelect label="Competency (optional)" name="competency_id" defaultValue="">
              <option value="">No competency selected</option>
              {competencies.map((competency) => (
                <option key={competency.id} value={competency.id}>{competency.code} - {competency.title}</option>
              ))}
            </FormSelect>
            <FormInput label="Due Date" name="due_at" type="datetime-local" />
            <FormTextarea
              label="Rubric (optional — one criterion per line, formatted as Name | Points)"
              name="rubric"
              rows={4}
              placeholder={"Planning and layout | 20\nSafety compliance | 20\nFinal execution | 30"}
            />
            <SubmitButton>Create Project</SubmitButton>
          </form>
        </section>

        <section>
          <form action="/teacher/projects" className="card mb-6 flex flex-col gap-3 rounded-[1.5rem] p-4 sm:flex-row sm:items-end sm:justify-between">
            <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Status
              <select name="status" defaultValue={statusFilter} className="focus-ring min-h-11 min-w-48 rounded-xl border border-slate-200 bg-white px-4 py-2 font-normal dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="all">All projects</option>
              </select>
            </label>
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-teal-200 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-800 dark:hover:text-teal-400">Apply Filter</button>
          </form>

          {!projects.length ? (
            <EmptyState title="No projects yet" message="Create a project to start tracking milestones and learner progress." />
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => {
                const competency = firstRelation(project.competencies);
                const assignments = project.project_assignments ?? [];
                const needsIntervention = assignments.filter((assignment) => assignment.status === "needs_intervention").length;
                const delayed = assignments.filter((assignment) => assignment.status === "delayed").length;

                return (
                  <Link key={project.id} href={`/teacher/projects/${project.id}`} className="card block rounded-[1.5rem] p-6 hover:-translate-y-0.5 hover:shadow-xl">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-400">{competency?.code ?? "EIM"}</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">{project.title}</h3>
                      </div>
                      <span className={project.is_active !== false ? "rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-400" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400"}>
                        {project.is_active !== false ? "Active" : "Archived"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      {assignments.length} learner{assignments.length === 1 ? "" : "s"} assigned
                      {project.due_at ? ` · Due ${new Date(project.due_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}` : ""}
                    </p>
                    {needsIntervention || delayed ? (
                      <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        {needsIntervention ? `${needsIntervention} needing intervention` : ""}
                        {needsIntervention && delayed ? " · " : ""}
                        {delayed ? `${delayed} delayed` : ""}
                      </p>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
