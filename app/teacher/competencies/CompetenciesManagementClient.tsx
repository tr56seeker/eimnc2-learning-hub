"use client";

import { useState } from "react";
import { FormInput, FormSelect, FormTextarea, SubmitButton } from "@/components/FormFields";
import { Modal } from "@/components/ui/Modal";
import { createCompetencyAction, deleteCompetencyAction, moveCompetencyAction, setCompetencyActiveAction, updateCompetencyAction } from "./actions";

export type ManagedCompetency = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  gradeLevel: number | null;
  isActive: boolean;
};

function CompetencyForm({ competency, onSubmit }: { competency?: ManagedCompetency; onSubmit?: () => void }) {
  return (
    <form action={competency ? updateCompetencyAction.bind(null, competency.id) : createCompetencyAction} onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput label="Code" name="code" required defaultValue={competency?.code} placeholder="LO2.1" />
        <FormSelect label="Grade Level (optional)" name="grade_level" defaultValue={competency?.gradeLevel ?? ""}>
          <option value="">Not set</option>
          <option value="11">Grade 11</option>
          <option value="12">Grade 12</option>
        </FormSelect>
      </div>
      <FormInput label="Title" name="title" required defaultValue={competency?.title} placeholder="Install Wiring Devices" />
      <FormTextarea label="Description (optional)" name="description" rows={3} defaultValue={competency?.description ?? ""} placeholder="What this competency covers." />
      <SubmitButton>{competency ? "Save Changes" : "Add Competency"}</SubmitButton>
    </form>
  );
}

export function CompetenciesManagementClient({ competencies }: { competencies: ManagedCompetency[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedCompetency | null>(null);

  return (
    <>
      <section className="border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/20">
        <div className="sticky top-[118px] z-10 border-b border-slate-200 bg-slate-50/95 shadow-sm backdrop-blur lg:top-[76px] dark:border-slate-700 dark:bg-slate-800/95">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Competency Registry</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{competencies.length} competenc{competencies.length === 1 ? "y" : "ies"} shown</p>
            </div>
            <button type="button" onClick={() => setIsAddOpen(true)} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-teal-700 active:scale-[0.97]">
              Add Competency
            </button>
          </div>

          {competencies.length ? (
            <div className="hidden grid-cols-[90px_150px_minmax(0,1fr)_90px_100px_230px] items-center gap-4 border-t border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 lg:grid sm:px-6 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
              <span>Order</span>
              <span>Code</span>
              <span>Title</span>
              <span>Grade</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px] divide-y divide-slate-200/70 dark:divide-slate-700/70">
            {competencies.map((competency, index) => (
              <div
                key={competency.id}
                className="grid grid-cols-[90px_150px_minmax(0,1fr)_90px_100px_230px] items-center gap-4 px-5 py-4 text-sm text-slate-700 transition-colors hover:bg-slate-50/70 sm:px-6 dark:text-slate-300 dark:hover:bg-slate-800/60"
              >
                <div className="flex gap-1">
                  <form action={moveCompetencyAction.bind(null, competency.id, "up")}>
                    <button
                      type="submit"
                      disabled={index === 0}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800"
                      aria-label={`Move ${competency.code} up`}
                    >
                      ▲
                    </button>
                  </form>
                  <form action={moveCompetencyAction.bind(null, competency.id, "down")}>
                    <button
                      type="submit"
                      disabled={index === competencies.length - 1}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800"
                      aria-label={`Move ${competency.code} down`}
                    >
                      ▼
                    </button>
                  </form>
                </div>

                <span className="whitespace-nowrap font-semibold text-slate-950 dark:text-slate-100">{competency.code}</span>

                <span className="min-w-0">{competency.title}</span>

                <span>{competency.gradeLevel ? `Grade ${competency.gradeLevel}` : "—"}</span>

                <span>
                  <span className={competency.isActive ? "rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-amber-950/40 dark:text-amber-400" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400"}>
                    {competency.isActive ? "Active" : "Archived"}
                  </span>
                </span>

                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={() => setEditing(competency)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-teal-700 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-amber-400 active:scale-[0.97]">Edit</button>
                  <form action={setCompetencyActiveAction.bind(null, competency.id, !competency.isActive)}>
                    <button className={competency.isActive ? "rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30" : "rounded-lg px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 dark:text-amber-400 dark:hover:bg-amber-950/30"}>
                      {competency.isActive ? "Archive" : "Restore"}
                    </button>
                  </form>
                  {!competency.isActive ? (
                    <form
                      action={deleteCompetencyAction.bind(null, competency.id)}
                      onSubmit={(event) => {
                        if (!window.confirm(`Permanently delete "${competency.code}"? This cannot be undone. Lessons, exams, and question bank items using it will keep their content but lose this category link.`)) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30">
                        Delete
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
        {!competencies.length ? <div className="m-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">No competencies match this filter.</div> : null}
      </section>

      {isAddOpen ? (
        <Modal title="Add Competency" description="Competencies show up as a category choice for lessons, question bank items, and projects." onClose={() => setIsAddOpen(false)}>
          <CompetencyForm onSubmit={() => setIsAddOpen(false)} />
        </Modal>
      ) : null}
      {editing ? (
        <Modal title={`Edit ${editing.code}`} onClose={() => setEditing(null)}>
          <CompetencyForm competency={editing} onSubmit={() => setEditing(null)} />
        </Modal>
      ) : null}
    </>
  );
}
