import { EmptyState } from "@/components/EmptyState";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireLearner } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { firstRelation } from "@/lib/relations";

type LearnerAchievementRow = {
  id: string;
  awarded_at: string;
  evidence_note: string | null;
  achievements: { name: string; description: string | null; icon: string | null; category: string } | { name: string; description: string | null; icon: string | null; category: string }[] | null;
};

export default async function LearnerAchievementsPage() {
  const { profile, supabase } = await requireLearner();

  const { data: awarded } = await supabase
    .from("learner_achievements")
    .select("id, awarded_at, evidence_note, achievements(name, description, icon, category)")
    .eq("learner_id", profile.id)
    .order("awarded_at", { ascending: false })
    .returns<LearnerAchievementRow[]>();

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Achievements" title="My Achievements" description="Recognitions you've earned along the way." />

      {!awarded?.length ? (
        <EmptyState title="No achievements yet" message="Keep learning — your teacher will recognize your progress here." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {awarded.map((entry) => {
            const achievement = firstRelation(entry.achievements);

            return (
              <div key={entry.id} className="card rounded-[1.75rem] p-6 text-center">
                <p className="text-4xl">{achievement?.icon || "🏅"}</p>
                <h2 className="mt-3 text-lg font-semibold text-slate-950 dark:text-slate-100">{achievement?.name}</h2>
                {achievement?.description ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{achievement.description}</p> : null}
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-amber-400">{formatDateTime(entry.awarded_at)}</p>
                {entry.evidence_note ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{entry.evidence_note}</p> : null}
              </div>
            );
          })}
        </div>
      )}
    </PortalShell>
  );
}
