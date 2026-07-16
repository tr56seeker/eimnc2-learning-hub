"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FlashMessage } from "@/components/FlashMessage";
import { Modal } from "@/components/ui/Modal";
import { onlineBadgeClass, statusBadgeClass } from "@/lib/badges";
import { formatGradeSection, formatLearnerCompleteName } from "@/lib/learner-accounts";
import { getOnlineStatus } from "@/lib/presence";
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

const fieldClass = "focus-ring min-h-11 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 font-normal text-slate-900 shadow-sm shadow-slate-200/40 dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-100 dark:shadow-black/20";
const menuItemClass = "block w-full px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-700 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-amber-400";

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
      <FlashMessage message={message} variant="error" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Last Name
          <input name="last_name" required className={fieldClass} placeholder="Dela Cruz" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          First Name
          <input name="first_name" required className={fieldClass} placeholder="Juan" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Middle Name
          <input name="middle_name" className={fieldClass} placeholder="Tamayo" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Suffix
          <input name="suffix" className={fieldClass} placeholder="Jr., Sr., III" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Sex
          <select name="sex" defaultValue="" className={fieldClass}>
            <option value="">Not specified</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Birthday / Date of Birth
          <input name="birthdate" type="date" className={fieldClass} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          LRN
          <input name="lrn" className={fieldClass} placeholder="123456789012" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Login ID or Email
          <input name="login_id" className={fieldClass} placeholder="Leave blank to use LRN" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Grade Level
          <select name="grade_level" className={fieldClass} defaultValue="">
            <option value="">Select grade</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Section
          <select name="section_id" className={fieldClass} defaultValue="">
            <option value="">No section</option>
            {sections.filter((section) => section.is_active !== false).map((section) => (
              <option key={section.id} value={section.id}>
                {sectionLabel(section)} / SY {section.school_year}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Status
          <select name="status" className={fieldClass} defaultValue="active">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4 text-sm text-teal-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
        Initial password: <span className="font-semibold">eimnc2password</span>. The learner will be required to change it after signing in.
      </div>

      <button disabled={isPending} className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? "Adding..." : "Add Learner"}
      </button>
    </form>
  );
}

function EditLearnerForm({ learner, sections }: { learner: LearnerListItem; sections: SectionOption[] }) {
  return (
    <form action={updateLearnerAction.bind(null, learner.id)} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Last Name
          <input name="last_name" required defaultValue={learner.lastName ?? ""} className={fieldClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          First Name
          <input name="first_name" required defaultValue={learner.firstName ?? ""} className={fieldClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Middle Name
          <input name="middle_name" defaultValue={learner.middleName ?? learner.middleInitial ?? ""} className={fieldClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Suffix
          <input name="suffix" defaultValue={learner.suffix ?? ""} className={fieldClass} placeholder="Jr., Sr., III" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Sex
          <select name="sex" defaultValue={learner.sex ?? ""} className={fieldClass}>
            <option value="">Not specified</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Birthday / Date of Birth
          <input name="birthdate" type="date" defaultValue={learner.birthdate ?? ""} className={fieldClass} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          LRN
          <input name="lrn" defaultValue={learner.lrn ?? ""} className={fieldClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Login ID or Email
          <input name="login_id" defaultValue={learner.loginId ?? ""} className={fieldClass} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Grade Level
          <select name="grade_level" defaultValue={learner.gradeLevel ?? ""} className={fieldClass}>
            <option value="">No grade</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Section
          <select name="section_id" defaultValue={learner.sectionId ?? ""} className={fieldClass}>
            <option value="">No section</option>
            {sections.filter((section) => section.is_active !== false || section.id === learner.sectionId).map((section) => (
              <option key={section.id} value={section.id}>
                {sectionLabel(section)} / SY {section.school_year}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Status
          <select name="status" defaultValue={learner.status ?? "active"} className={fieldClass}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <button className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:bg-teal-700">
        Save Learner
      </button>
    </form>
  );
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
        <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5 dark:border-amber-900/50 dark:bg-amber-950/40">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-500 dark:text-slate-400">Learner Name</dt>
              <dd className="mt-1 font-semibold text-slate-950 dark:text-slate-100">{state.credentials.learnerName}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500 dark:text-slate-400">Login ID</dt>
              <dd className="mt-1 font-semibold text-slate-950 dark:text-slate-100">{state.credentials.loginId}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-semibold text-slate-500 dark:text-slate-400">Temporary Password</dt>
              <dd className="mt-1 font-semibold text-slate-950 dark:text-slate-100">{state.credentials.temporaryPassword}</dd>
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

      <FlashMessage message={state.ok ? null : state.message} variant="error" />

      <form action={action} className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          New Temporary Password
          <input name="password" type="text" required minLength={8} defaultValue="eimnc2password" className={fieldClass} placeholder="At least 8 characters" />
        </label>
        <button disabled={isPending} className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.97]">
          {isPending ? "Resetting..." : "Reset Password"}
        </button>
      </form>
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuId) return;

    const closeMenu = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest("[data-actions-menu]")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [openMenuId]);

  useEffect(() => {
    if (state.ok && state.credentials) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time reaction to a server action result, not a value derivable during render
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
      <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/20">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-700 dark:bg-slate-800/60">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Enrolled learners</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{learners.length} learner{learners.length === 1 ? "" : "s"} shown</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:bg-teal-700"
          >
            Add Learner
          </button>
        </div>

        <div className={`overflow-x-auto ${openMenuId ? "pb-28" : ""}`}>
          <table className="min-w-[940px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <th className="w-[34%] border-b border-slate-200 px-5 py-3.5 dark:border-slate-700">Learner&apos;s Complete Name</th>
                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 dark:border-slate-700">LRN</th>
                <th className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">Grade &amp; Section</th>
                <th className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">Sex</th>
                <th className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">Online Status</th>
                <th className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">Status</th>
                <th className="border-b border-slate-200 px-4 py-3 text-right dark:border-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {learners.map((learner) => {
                const nextStatus = learner.status === "inactive" || learner.status === "deleted" ? "active" : "inactive";
                const completeName = formatLearnerCompleteName(learner);
                const onlineStatus = getOnlineStatus(learner.lastSeenAt);
                const gradeSection = formatGradeSection({
                  gradeLevel: learner.gradeLevel,
                  sectionName: learner.sectionId ? learner.sectionName : null
                });

                return (
                  <tr key={learner.id} className="align-middle text-slate-700 hover:bg-slate-50/60 dark:text-slate-300 dark:hover:bg-slate-800/40">
                    <td className="border-b border-slate-200/70 px-5 py-3.5 dark:border-slate-700/70">
                      <Link href={`/teacher/learners/${learner.id}`} className="font-semibold text-slate-950 hover:text-teal-700 hover:underline hover:underline-offset-4 dark:text-slate-100 dark:hover:text-amber-400 active:scale-[0.97]">
                        {completeName}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap border-b border-slate-100 px-4 py-4 tabular-nums dark:border-slate-800">{learner.lrn ?? ""}</td>
                    <td className="border-b border-slate-100 px-4 py-4 font-medium dark:border-slate-800">{gradeSection}</td>
                    <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">{learner.sex ?? "Not specified"}</td>
                    <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800"><span className={onlineBadgeClass(onlineStatus)}>{onlineStatus.charAt(0).toUpperCase() + onlineStatus.slice(1)}</span></td>
                    <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
                      <span className={statusBadgeClass(learner.status)}>
                        {learner.status ?? "active"}
                      </span>
                    </td>
                    <td className="border-b border-slate-200/70 px-4 py-3 text-right dark:border-slate-700/70">
                      <div className="relative inline-block" data-actions-menu>
                        <button
                          type="button"
                          aria-label={`Actions for ${completeName}`}
                          aria-expanded={openMenuId === learner.id}
                          onClick={() => setOpenMenuId((current) => current === learner.id ? null : learner.id)}
                          className="grid h-9 w-9 place-items-center rounded-lg text-xl font-semibold leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                        >
                          ⋯
                        </button>
                        {openMenuId === learner.id ? (
                          <div className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
                            <Link href={`/teacher/learners/${learner.id}`} onClick={() => setOpenMenuId(null)} className={menuItemClass}>View Profile</Link>
                            <button type="button" onClick={() => { setOpenMenuId(null); setSelectedLearner(learner); setMode("edit"); }} className={menuItemClass}>Edit</button>
                            <button type="button" onClick={() => { setOpenMenuId(null); setSelectedLearner(learner); setMode("reset"); }} className={menuItemClass}>Reset Password</button>
                            <form action={toggleLearnerStatusAction.bind(null, learner.id, nextStatus)} onSubmit={() => setOpenMenuId(null)}>
                              <button className={menuItemClass}>{nextStatus === "active" ? "Activate" : "Deactivate"}</button>
                            </form>
                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                        <form
                          action={softDeleteLearnerAction.bind(null, learner.id)}
                          onSubmit={(event) => {
                            if (
                              !window.confirm(
                                "This marks the learner as deleted and hides them from active lists. You can restore access later from the Activate option."
                              )
                            ) {
                              event.preventDefault();
                            }
                            setOpenMenuId(null);
                          }}
                        >
                              <button className="block w-full px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 active:scale-[0.97]">Delete</button>
                        </form>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!learners.length ? (
          <div className="m-6 rounded-xl border border-dashed border-slate-300/80 bg-slate-50/60 p-10 text-center text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-400">
            No learners match the current filters.
          </div>
        ) : null}
      </section>

      {isAddOpen ? (
        <Modal
          title="Add Learner"
          description="Create the learner login and assign their profile to a section."
          onClose={() => setIsAddOpen(false)}
          size="lg"
        >
          <AddLearnerForm sections={sections} action={formAction} isPending={isPending} message={state.ok ? "" : state.message} />
        </Modal>
      ) : null}

      {showCredentials && state.credentials ? (
        <Modal
          title="Learner Credentials"
          description="Share these credentials privately. They are not stored in the learner table."
          onClose={() => setShowCredentials(false)}
          size="lg"
        >
          <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5 dark:border-amber-900/50 dark:bg-amber-950/40">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-500 dark:text-slate-400">Learner Name</dt>
                <dd className="mt-1 font-semibold text-slate-950 dark:text-slate-100">{state.credentials.learnerName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500 dark:text-slate-400">Section</dt>
                <dd className="mt-1 font-semibold text-slate-950 dark:text-slate-100">{state.credentials.sectionName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500 dark:text-slate-400">Login ID</dt>
                <dd className="mt-1 font-semibold text-slate-950 dark:text-slate-100">{state.credentials.loginId}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500 dark:text-slate-400">Temporary Password</dt>
                <dd className="mt-1 font-semibold text-slate-950 dark:text-slate-100">{state.credentials.temporaryPassword}</dd>
              </div>
            </dl>
          </div>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(credentialText);
              setCopied(true);
            }}
            className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] hover:bg-teal-700"
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
          size="lg"
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
