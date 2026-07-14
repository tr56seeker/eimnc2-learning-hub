import type { ProfileStatus } from "@/lib/types";
import type { OnlineStatus } from "@/lib/presence";

export function statusBadgeClass(status: ProfileStatus | null | undefined) {
  if (status === "deleted") return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600";
  if (status === "inactive") return "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700";
  return "rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700";
}

export function onlineBadgeClass(status: OnlineStatus) {
  if (status === "online") return "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700";
  if (status === "away") return "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700";
  return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600";
}
