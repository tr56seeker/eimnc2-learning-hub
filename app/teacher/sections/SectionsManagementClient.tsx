"use client";

import { useState } from "react";
import { FormInput, FormSelect, SubmitButton } from "@/components/FormFields";
import { createSectionAction, removeSectionAction, updateSectionAction } from "./actions";

export type ManagedSection = {
  id: string;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  isActive: boolean;
  learnerCount: number;
};

function SectionForm({ section, onSubmit }: { section?: ManagedSection; onSubmit?: () => void }) {
  return (
    <form action={section ? updateSectionAction.bind(null, section.id) : createSectionAction} onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormSelect label="Grade Level" name="grade_level" required defaultValue={section?.gradeLevel ?? ""}>
          <option value="">Select grade level</option>
          <option value="11">Grade 11</option>
          <option value="12">Grade 12</option>
        </FormSelect>
        <FormInput label="Section Name" name="name" required defaultValue={section?.name} placeholder="Apollo" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput label="School Year" name="school_year" required defaultValue={section?.schoolYear ?? "2026-2027"} placeholder="2026-2027" />
        <FormSelect label="Status" name="is_active" required defaultValue={section?.isActive === false ? "false" : "true"}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </FormSelect>
      </div>
      <SubmitButton>{section ? "Save Changes" : "Add Section"}</SubmitButton>
    </form>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <section className="w-full max-w-2xl rounded-[1.75rem] border border-white/80 bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-50">Close</button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function SectionsManagementClient({ sections }: { sections: ManagedSection[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedSection | null>(null);

  return (
    <>
      <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Section Registry</h2>
            <p className="mt-1 text-sm text-slate-500">{sections.length} section{sections.length === 1 ? "" : "s"} shown</p>
          </div>
          <button type="button" onClick={() => setIsAddOpen(true)} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-teal-700">Add Section</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-5 py-3.5">Grade Level</th>
                <th className="border-b border-slate-200 px-4 py-3.5">Section Name</th>
                <th className="border-b border-slate-200 px-4 py-3.5">Display Name</th>
                <th className="border-b border-slate-200 px-4 py-3.5">School Year</th>
                <th className="border-b border-slate-200 px-4 py-3.5">Status</th>
                <th className="border-b border-slate-200 px-4 py-3.5 text-center">Learner Count</th>
                <th className="border-b border-slate-200 px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr key={section.id} className="text-slate-700 hover:bg-slate-50/60">
                  <td className="border-b border-slate-200/70 px-5 py-4 font-medium">Grade {section.gradeLevel}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4 font-semibold text-slate-950">{section.name}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4">Grade {section.gradeLevel} - {section.name}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4 tabular-nums">{section.schoolYear}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4"><span className={section.isActive ? "rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"}>{section.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="border-b border-slate-200/70 px-4 py-4 text-center tabular-nums">{section.learnerCount}</td>
                  <td className="border-b border-slate-200/70 px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditing(section)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-teal-700">Edit</button>
                      <form action={removeSectionAction.bind(null, section.id)} onSubmit={(event) => { if (!window.confirm("Remove this section? This may affect learner enrollment and gradebook filters.")) event.preventDefault(); }}>
                        <button className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Remove</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!sections.length ? <div className="m-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center text-slate-500">No sections match this status filter.</div> : null}
      </section>

      {isAddOpen ? <Modal title="Add Section" onClose={() => setIsAddOpen(false)}><SectionForm onSubmit={() => setIsAddOpen(false)} /></Modal> : null}
      {editing ? <Modal title={`Edit Grade ${editing.gradeLevel} - ${editing.name}`} onClose={() => setEditing(null)}><SectionForm section={editing} onSubmit={() => setEditing(null)} /></Modal> : null}
    </>
  );
}
