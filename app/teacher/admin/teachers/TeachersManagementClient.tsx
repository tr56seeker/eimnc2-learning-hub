"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FlashMessage } from "@/components/FlashMessage";
import { Modal } from "@/components/ui/Modal";
import { statusBadgeClass } from "@/lib/badges";
import { createTeacherAction, toggleTeacherStatusAction, type TeacherAccountState } from "./actions";
import type { TeacherAccount } from "./page";

const fieldClass = "focus-ring min-h-11 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 font-normal text-slate-900 shadow-sm shadow-slate-200/40";

const initialState: TeacherAccountState = { ok: false, message: "" };

export function TeachersManagementClient({ teachers, currentUserId }: { teachers: TeacherAccount[]; currentUserId: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createTeacherAction, initialState);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [copied, setCopied] = useState(false);

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
        `Name: ${state.credentials.fullName}`,
        `Login Email: ${state.credentials.email}`,
        `Temporary Password: ${state.credentials.temporaryPassword}`
      ].join("\n")
    : "";

  return (
    <>
      <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Staff accounts</h2>
            <p className="mt-1 text-sm text-slate-500">{teachers.length} account{teachers.length === 1 ? "" : "s"}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700"
          >
            Add Account
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <th className="border-b border-slate-200 px-5 py-3.5">Name</th>
                <th className="border-b border-slate-200 px-4 py-3">Email</th>
                <th className="border-b border-slate-200 px-4 py-3">Role</th>
                <th className="border-b border-slate-200 px-4 py-3">Status</th>
                <th className="border-b border-slate-200 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => {
                const nextStatus = teacher.status === "inactive" || teacher.status === "deleted" ? "active" : "inactive";
                const isSelf = teacher.id === currentUserId;

                return (
                  <tr key={teacher.id} className="align-middle text-slate-700 hover:bg-slate-50/60">
                    <td className="border-b border-slate-200/70 px-5 py-3.5 font-semibold text-slate-950">
                      {teacher.fullName}
                      {isSelf ? <span className="ml-2 text-xs font-medium text-slate-400">(you)</span> : null}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4">{teacher.email}</td>
                    <td className="border-b border-slate-100 px-4 py-4 capitalize">{teacher.role}</td>
                    <td className="border-b border-slate-100 px-4 py-4">
                      <span className={statusBadgeClass(teacher.status)}>{teacher.status ?? "active"}</span>
                    </td>
                    <td className="border-b border-slate-200/70 px-4 py-3 text-right">
                      {isSelf ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <form action={toggleTeacherStatusAction.bind(null, teacher.id, nextStatus)}>
                          <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-teal-200 hover:text-teal-700">
                            {nextStatus === "active" ? "Activate" : "Deactivate"}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!teachers.length ? (
          <div className="m-6 rounded-xl border border-dashed border-slate-300/80 bg-slate-50/60 p-10 text-center text-slate-500">
            No staff accounts yet.
          </div>
        ) : null}
      </section>

      {isAddOpen ? (
        <Modal title="Add Account" description="Create a teacher or admin login." onClose={() => setIsAddOpen(false)} size="md">
          <form action={formAction} className="grid gap-5">
            <FlashMessage message={state.ok ? "" : state.message} variant="error" />

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Full Name
              <input name="full_name" required className={fieldClass} placeholder="Juan Dela Cruz" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Email
              <input name="email" type="email" required className={fieldClass} placeholder="juan.delacruz@deped.gov.ph" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Role
              <select name="role" defaultValue="teacher" className={fieldClass}>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4 text-sm text-teal-800">
              Initial password: <span className="font-semibold">eimnc2teacher</span>. The account must change it after signing in.
            </div>

            <button disabled={isPending} className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isPending ? "Creating..." : "Create Account"}
            </button>
          </form>
        </Modal>
      ) : null}

      {showCredentials && state.credentials ? (
        <Modal title="Account Credentials" description="Share these credentials privately." onClose={() => setShowCredentials(false)} size="md">
          <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-500">Name</dt>
                <dd className="mt-1 font-semibold text-slate-950">{state.credentials.fullName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Login Email</dt>
                <dd className="mt-1 font-semibold text-slate-950">{state.credentials.email}</dd>
              </div>
              <div className="sm:col-span-2">
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
    </>
  );
}
