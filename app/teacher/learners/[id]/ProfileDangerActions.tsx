"use client";

import { softDeleteLearnerAction, toggleLearnerStatusAction } from "../actions";
import type { ProfileStatus } from "@/lib/types";

const buttonClass = "rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-sm active:scale-[0.97]";

export function ProfileDangerActions({ learnerId, status }: { learnerId: string; status: ProfileStatus | null }) {
  const nextStatus = status === "active" ? "inactive" : "active";

  return (
    <div className="flex flex-wrap gap-3">
      <form
        action={toggleLearnerStatusAction.bind(null, learnerId, nextStatus)}
        onSubmit={(event) => {
          const label = nextStatus === "active" ? "activate" : "deactivate";
          if (!window.confirm(`Are you sure you want to ${label} this learner?`)) {
            event.preventDefault();
          }
        }}
      >
        <button className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60`}>
          {nextStatus === "active" ? "Activate learner" : "Deactivate learner"}
        </button>
      </form>

      <form
        action={softDeleteLearnerAction.bind(null, learnerId)}
        onSubmit={(event) => {
          if (
            !window.confirm(
              "This marks the learner as deleted and hides them from active lists. You can restore access later from the Activate option."
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <button className={`${buttonClass} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50`}>
          Delete learner
        </button>
      </form>
    </div>
  );
}
