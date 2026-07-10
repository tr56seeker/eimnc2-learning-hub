"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatLearnerName } from "@/lib/learner-accounts";
import {
  createLearnerAction,
  resetLearnerPasswordAction,
  softDeleteLearnerAction,
  toggleLearnerStatusAction,
  updateLearnerAction,
  type LearnerEnrollmentState,
  type LearnerPasswordResetState
} from "./actions";
import type { LearnerListItem, SectionOption } from "./types";

type LearnersManagementClientProps = {
  learners: LearnerListItem[];
  sections: SectionOption[];
};

const initialEnrollmentState: LearnerEnrollmentState = {
  ok: false,
  message: ""
};

const initialResetState: LearnerPasswordResetState = {
  ok: false,
  message: ""
};

const fieldClass = "focus-ring min-h-11 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 font-normal text-slate-900 shadow-sm shadow-slate-200/40";
const compactButtonClass = "rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700";

function sectionLabel(section: SectionOption) {
  return `Grade ${section.grade_level} - ${section.name}`;
}

function AddLearnerForm({
  sections,
  action,
  isPending,
  message
}: {
  sections: SectionOption[];
  action: (formData: FormData) => void;
  isPending: boolean;
  message: string;
}) {
  return (
    <form action={action} className="grid gap-5">
      {message ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Last Name
          <input name="last_name" required className={fieldClass} placeholder="Dela Cruz" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          First Name
          <input name="first_name" required className={fieldClass} placeholder="Juan" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Middle Initial
          <input name="middle_initial" maxLength={3} className={fieldClass} placeholder="T." />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          LRN
          <input name="lrn" className={fieldClass} placeholder="123456789012" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Login ID or Email
          <input name="login_id" className={fieldClass} placeholder="Leave blank to use LRN" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Grade Level
          <select name="grade_level" className={fieldClass} defaultValue="">
            <option value="">Select grade</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Section
          <select name="section_id" className={fieldClass} defaultValue="">
            <option value="">No section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {sectionLabel(section)} / SY {section.school_year}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Status
          <select name="status" className={fieldClass} defaultValue="active">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Temporary Password
        <input name="password" type="password" required minLength={8} className={fieldClass} placeholder="At least 8 characters" />
      </label>

      <button disabled={isPending} className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? "Adding..." : "Add Learner"}
      </button>
    </form>
  );
}

function EditLearnerForm({ learner, sections }: { learner: LearnerListItem; sections: SectionOption[] }) {
  return (
    <form action={updateLearnerAction.bind(null, learner.id)} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Last Name
          <input name="last_name" required defaultValue={learner.lastName ?? ""} className={fieldClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          First Name
          <input name="first_name" required defaultValue={learner.firstName ?? ""} className={fieldClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Middle Initial
          <input name="middle_initial" maxLength={3} defaultValue={learner.middleInitial ?? ""} className={fieldClass} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          LRN
          <input name="lrn" defaultValue={learner.lrn ?? ""} className={fieldClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Login ID or Email
          <input name="login_id" defaultValue={learner.loginId ?? ""} className={fieldClass} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Grade Level
          <select name="grade_level" defaultValue={learner.gradeLevel ?? ""} className={fieldClass}>
            <option value="">No grade</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Section
          <select name="section_id" defaultValue={learner.sectionId ?? ""} className={fieldClass}>
            <option value="">No section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {sectionLabel(section)} / SY {section.school_year}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Status
          <select name="status" defaultValue={learner.status ?? "active"} className={fieldClass}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <button className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">
        Save Learner
      </button>
    </form>
  );
}

function statusBadgeClass(status: LearnerListItem["status"]) {
  if (status === "deleted") return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600";
  if (status === "inactive") return "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700";
  return "rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700";
}

function ResetPasswordForm({ learner }: { learner: LearnerListItem }) {
  const [state, action, isPending] = useActionState(resetLearnerPasswordAction.bind(null, learner.id), initialResetState);
  const [copied, setCopied] = useState(false);
  const credentialText = state.credentials
    ? [
        `Learner Name: ${state.credentials.learnerName}`,
        `Login ID: ${state.credentials.loginId}`,
        `Temporary Password: ${state.credentials.temporaryPassword}`
      ].join("\n")
    : "";

  return (
    <div className="grid gap-5">
      {state.credentials ? (
        <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-500">Learner Name</dt>
              <dd className="mt-1 font-semibold text-slate-950">{state.credentials.learnerName}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Login ID</dt>
              <dd className="mt-1 font-semibold text-slate-950">{state.credentials.loginId}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-semibold text-slate-500">Temporary Password</dt>
              <dd className="mt-1 font-semibold text-slate-950">{state.credentials.temporaryPassword}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(credentialText);
              setCopied(true);
            }}
            className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-teal-700"
          >
            {copied ? "Copied" : "Copy Credentials"}
          </button>
        </div>
      ) : null}

      {state.message && !state.ok ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {state.message}
        </div>
      ) : null}

      <form action={action} className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          New Temporary Password
          <input name="password" type="password" required minLength={8} className={fieldClass} placeholder="At least 8 characters" />
        </label>
        <button disabled={isPending} className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
          {isPending ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

function Modal({
  title,
  description,
  children,
  onClose
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] border border-white/80 bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
            {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-50">
            Close
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function LearnersManagementClient({ learners, sections }: LearnersManagementClientProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createLearnerAction, initialEnrollmentState);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<LearnerListItem | null>(null);
  const [mode, setMode] = useState<"edit" | "reset">("edit");
  const [showCredentials, setShowCredentials] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state.ok && state.credentials) {
      setIsAddOpen(false);
      setShowCredentials(true);
      setCopied(false);
      router.refresh();
    }
  }, [router, state]);

  const credentialText = state.credentials
    ? [
        `Learner Name: ${state.credentials.learnerName}`,
        `Login ID: ${state.credentials.loginId}`,
        `Temporary Password: ${state.credentials.temporaryPassword}`,
        `Section: ${state.credentials.sectionName}`
      ].join("\n")
    : "";

  return (
    <>
      <section className="card rounded-[1.75rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Enrolled learners</h2>
            <p className="mt-1 text-sm text-slate-500">{learners.length} learner{learners.length === 1 ? "" : "s"} shown</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700"
          >
            Add Learner
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[1040px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                <th className="border-b border-slate-200 px-4 py-3">Learner Name</th>
                <th className="border-b border-slate-200 px-4 py-3">LRN</th>
                <th className="border-b border-slate-200 px-4 py-3">Login ID / Email</th>
                <th className="border-b border-slate-200 px-4 py-3">Grade Level</th>
                <th className="border-b border-slate-200 px-4 py-3">Section</th>
                <th className="border-b border-slate-200 px-4 py-3">Status</th>
                <th className="border-b border-slate-200 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {learners.map((learner) => {
                const nextStatus = learner.status === "inactive" || learner.status === "deleted" ? "active" : "inactive";
                const formalName = formatLearnerName(learner);

                return (
                  <tr key={learner.id} className="align-middle text-slate-700">
                    <td className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-950">
                      {formalName}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4 tabular-nums">{learner.lrn ?? ""}</td>
                    <td className="border-b border-slate-100 px-4 py-4">{learner.loginId ?? ""}</td>
                    <td className="border-b border-slate-100 px-4 py-4">{learner.gradeLevel ? `Grade ${learner.gradeLevel}` : ""}</td>
                    <td className="border-b border-slate-100 px-4 py-4">{learner.sectionName}</td>
                    <td className="border-b border-slate-100 px-4 py-4">
                      <span className={statusBadgeClass(learner.status)}>
                        {learner.status ?? "active"}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link href={`/teacher/learners/${learner.id}`} className={compactButtonClass}>
                          View Profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLearner(learner);
                            setMode("edit");
                          }}
                          className={compactButtonClass}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLearner(learner);
                            setMode("reset");
                          }}
                          className={compactButtonClass}
                        >
                          Reset Password
                        </button>
                        <form action={toggleLearnerStatusAction.bind(null, learner.id, nextStatus)}>
                          <button className={compactButtonClass}>
                            {nextStatus === "active" ? "Activate" : "Deactivate"}
                          </button>
                        </form>
                        <form
                          action={softDeleteLearnerAction.bind(null, learner.id)}
                          onSubmit={(event) => {
                            if (
                              !window.confirm(
                                "This may remove the learner account and related profile data. This action cannot be undone."
                              )
                            ) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <button className="rounded-full border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-50">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!learners.length ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300/80 bg-white/70 p-10 text-center text-slate-500">
            No learners match the current filters.
          </div>
        ) : null}
      </section>

      {isAddOpen ? (
        <Modal
          title="Add Learner"
          description="Create the learner login and assign their profile to a section."
          onClose={() => setIsAddOpen(false)}
        >
          <AddLearnerForm sections={sections} action={formAction} isPending={isPending} message={state.ok ? "" : state.message} />
        </Modal>
      ) : null}

      {showCredentials && state.credentials ? (
        <Modal
          title="Learner Credentials"
          description="Share these credentials privately. They are not stored in the learner table."
          onClose={() => setShowCredentials(false)}
        >
          <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-500">Learner Name</dt>
                <dd className="mt-1 font-semibold text-slate-950">{state.credentials.learnerName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Section</dt>
                <dd className="mt-1 font-semibold text-slate-950">{state.credentials.sectionName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Login ID</dt>
                <dd className="mt-1 font-semibold text-slate-950">{state.credentials.loginId}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Temporary Password</dt>
                <dd className="mt-1 font-semibold text-slate-950">{state.credentials.temporaryPassword}</dd>
              </div>
            </dl>
          </div>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(credentialText);
              setCopied(true);
            }}
            className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700"
          >
            {copied ? "Copied" : "Copy Credentials"}
          </button>
        </Modal>
      ) : null}

      {selectedLearner ? (
        <Modal
          title={mode === "edit" ? "Edit Learner" : "Reset Password"}
          description={mode === "edit" ? "Update profile, login ID, section, and status." : "Set a temporary password and require the learner to change it on next login."}
          onClose={() => setSelectedLearner(null)}
        >
          {mode === "edit" ? (
            <EditLearnerForm learner={selectedLearner} sections={sections} />
          ) : (
            <ResetPasswordForm learner={selectedLearner} />
          )}
        </Modal>
      ) : null}
    </>
  );
}
