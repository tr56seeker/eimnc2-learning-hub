export type OnlineStatus = "online" | "away" | "offline";

export function getOnlineStatus(lastSeenAt: string | null | undefined, now = new Date()): OnlineStatus {
  if (!lastSeenAt) return "offline";
  const seenAt = new Date(lastSeenAt);
  if (Number.isNaN(seenAt.getTime())) return "offline";

  const elapsedMinutes = (now.getTime() - seenAt.getTime()) / 60_000;
  if (elapsedMinutes <= 3) return "online";
  if (elapsedMinutes <= 30) return "away";
  return "offline";
}

export function calculateAge(birthdate: string | null | undefined, today = new Date()) {
  if (!birthdate) return null;
  const [year, month, day] = birthdate.split("-").map(Number);
  if (!year || !month || !day) return null;

  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  return age >= 0 ? age : null;
}
