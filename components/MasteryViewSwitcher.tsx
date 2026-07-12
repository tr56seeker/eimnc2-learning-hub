"use client";

import { useRouter } from "next/navigation";

export function MasteryViewSwitcher({ current }: { current: "learner" | "competency" | "section" }) {
  const router = useRouter();

  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      View by
      <select
        defaultValue={current}
        onChange={(event) => router.push(`/teacher/mastery?view=${event.target.value}`)}
        className="focus-ring min-h-12 max-w-xs rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 font-normal text-slate-900 shadow-sm shadow-slate-200/40"
      >
        <option value="learner">Per Learner</option>
        <option value="competency">Per Competency</option>
        <option value="section">Per Section</option>
      </select>
    </label>
  );
}
