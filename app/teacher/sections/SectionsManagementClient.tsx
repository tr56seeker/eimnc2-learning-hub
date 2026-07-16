"use client";

import { useState } from "react";
import { FormInput, FormSelect, SubmitButton } from "@/components/FormFields";
import { Modal } from "@/components/ui/Modal";
import { createSectionAction, removeSectionAction, setSectionTeachersAction, updateSectionAction } from "./actions";

export type ManagedTeacher = {
  id: string;
  full_name: string;
};

export type ManagedSection = {
  id: string;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  isActive: boolean;
  learnerCount: number;
  assignedTeacherIds: string[];
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

function TeacherAssignmentForm({
  section,
  teachers,
  onSubmit
}: {
  section: ManagedSection;
  teachers: ManagedTeacher[];
  onSubmit?: () => void;
}) {
  return (
    <form action={setSectionTeachersAction.bind(null, section.id)} onSubmit={onSubmit} className="grid gap-5">
      <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
        Only assigned teachers will see this section&apos;s learners, submissions, exam attempts, and gradebook entries.
      </p>
      {teachers.length ? (
        <div className="grid gap-2">
          {teachers.map((teacher) => (
            <label key={teacher.id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-300">
              <input
                type="checkbox"
                name="teacher_ids"
                value={teacher.id}
                defaultChecked={section.assignedTeacherIds.includes(teacher.id)}
                className="h-4 w-4 accent-teal-700"
              />
              {teacher.full_name}
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">No teacher/admin accounts found.</p>
      )}
      <SubmitButton>Save Assignments</SubmitButton>
    </form>
  );
}

export function SectionsManagementClient({ sections, teachers }: { sections: ManagedSection[]; teachers: ManagedTeacher[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedSection | null>(null);
  const [assigning, setAssigning] = useState<ManagedSection | null>(null);
  const teacherNameById = new Map(teachers.map((teacher) => [teacher.id, teacher.full_name]));

  return (
    <>
      <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/20">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-700 dark:bg-slate-800/60">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Section Registry</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sections.length} section{sections.length === 1 ? "" : "s"} shown</p>
          </div>
          <button type="button" onClick={() => setIsAddOpen(true)} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-teal-700">Add Section</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-700">Grade Level</th>
                <th className="border-b border-slate-200 px-4 py-3.5 dark:border-slate-700">Section Name</th>
                <th className="border-b border-slate-200 px-4 py-3.5 dark:border-slate-700">Display Name</th>
                <th className="border-b border-slate-200 px-4 py-3.5 dark:border-slate-700">School Year</th>
                <th className="border-b border-slate-200 px-4 py-3.5 dark:border-slate-700">Status</th>
                <th className="border-b border-slate-200 px-4 py-3.5 text-center dark:border-slate-700">Learner Count</th>
                <th className="border-b border-slate-200 px-4 py-3.5 dark:border-slate-700">Assigned Teachers</th>
                <th className="border-b border-slate-200 px-5 py-3.5 text-right dark:border-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr key={section.id} className="text-slate-700 hover:bg-slate-50/60 dark:text-slate-300 dark:hover:bg-slate-800/40">
                  <td className="border-b border-slate-200/70 px-5 py-4 font-medium dark:border-slate-700/70">Grade {section.gradeLevel}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4 font-semibold text-slate-950 dark:border-slate-700/70 dark:text-slate-100">{section.name}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4 dark:border-slate-700/70">Grade {section.gradeLevel} - {section.name}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4 tabular-nums dark:border-slate-700/70">{section.schoolYear}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4 dark:border-slate-700/70"><span className={section.isActive ? "rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-400" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400"}>{section.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="border-b border-slate-200/70 px-4 py-4 text-center tabular-nums dark:border-slate-700/70">{section.learnerCount}</td>
                  <td className="border-b border-slate-200/70 px-4 py-4 text-sm text-slate-600 dark:border-slate-700/70 dark:text-slate-400">
                    {section.assignedTeacherIds.length
                      ? section.assignedTeacherIds.map((id) => teacherNameById.get(id) ?? "Unknown").join(", ")
                      : <span className="text-amber-700 dark:text-amber-300">Unassigned</span>}
                  </td>
                  <td className="border-b border-slate-200/70 px-5 py-4 dark:border-slate-700/70">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setAssigning(section)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-teal-700 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-teal-400">Teachers</button>
                      <button type="button" onClick={() => setEditing(section)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-teal-700 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-teal-400">Edit</button>
                      <form action={removeSectionAction.bind(null, section.id)} onSubmit={(event) => { if (!window.confirm("Remove this section? This may affect learner enrollment and gradebook filters.")) event.preventDefault(); }}>
                        <button className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">Remove</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!sections.length ? <div className="m-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">No sections match this status filter.</div> : null}
      </section>

      {isAddOpen ? <Modal title="Add Section" onClose={() => setIsAddOpen(false)}><SectionForm onSubmit={() => setIsAddOpen(false)} /></Modal> : null}
      {editing ? <Modal title={`Edit Grade ${editing.gradeLevel} - ${editing.name}`} onClose={() => setEditing(null)}><SectionForm section={editing} onSubmit={() => setEditing(null)} /></Modal> : null}
      {assigning ? (
        <Modal
          title={`Assign Teachers — Grade ${assigning.gradeLevel} - ${assigning.name}`}
          description="Choose which teacher accounts can view and manage this section's learners."
          onClose={() => setAssigning(null)}
        >
          <TeacherAssignmentForm section={assigning} teachers={teachers} onSubmit={() => setAssigning(null)} />
        </Modal>
      ) : null}
    </>
  );
}
