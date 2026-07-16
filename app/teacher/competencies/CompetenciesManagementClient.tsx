"use client";

import { useState } from "react";
import { FormInput, FormSelect, FormTextarea, SubmitButton } from "@/components/FormFields";
import { Modal } from "@/components/ui/Modal";
import { createCompetencyAction, moveCompetencyAction, setCompetencyActiveAction, updateCompetencyAction } from "./actions";

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
      <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/20">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-700 dark:bg-slate-800/60">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Competency Registry</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{competencies.length} competenc{competencies.length === 1 ? "y" : "ies"} shown</p>
          </div>
          <button type="button" onClick={() => setIsAddOpen(true)} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-teal-700">
            Add Competency
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-700">Order</th>
                <th className="border-b border-slate-200 px-4 py-3.5 dark:border-slate-700">Code</th>
                <th className="border-b border-slate-200 px-4 py-3.5 dark:border-slate-700">Title</th>
                <th className="border-b border-slate-200 px-4 py-3.5 dark:border-slate-700">Grade</th>
                <th className="border-b border-slate-200 px-4 py-3.5 dark:border-slate-700">Status</th>
                <th className="border-b border-slate-200 px-5 py-3.5 text-right dark:border-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {competencies.map((competency, index) => (
                <tr key={competency.id} className="text-slate-700 hover:bg-slate-50/60 dark:text-slate-300 dark:hover:bg-slate-800/40">
                  <td className="border-b border-slate-200/70 px-5 py-4 dark:border-slate-700/70">
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
                  </td>
                  <td className="border-b border-slate-200/70 px-4 py-4 font-semibold text-slate-950 dark:border-slate-700/70 dark:text-slate-100">{competency.code}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4 dark:border-slate-700/70">{competency.title}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4 dark:border-slate-700/70">{competency.gradeLevel ? `Grade ${competency.gradeLevel}` : "—"}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4 dark:border-slate-700/70">
                    <span className={competency.isActive ? "rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-400" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400"}>
                      {competency.isActive ? "Active" : "Archived"}
                    </span>
                  </td>
                  <td className="border-b border-slate-200/70 px-5 py-4 dark:border-slate-700/70">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditing(competency)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-teal-700 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-teal-400">Edit</button>
                      <form action={setCompetencyActiveAction.bind(null, competency.id, !competency.isActive)}>
                        <button className={competency.isActive ? "rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30" : "rounded-lg px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/30"}>
                          {competency.isActive ? "Archive" : "Restore"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
