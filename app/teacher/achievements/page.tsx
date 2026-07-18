import { EmptyState } from "@/components/EmptyState";
import { FlashMessage } from "@/components/FlashMessage";
import { FormInput, FormSelect, FormTextarea, SubmitButton } from "@/components/FormFields";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { firstRelation } from "@/lib/relations";
import { awardAchievementAction, createAchievementAction, revokeAchievementAction } from "./actions";

type AchievementRow = { id: string; name: string; description: string | null; icon: string | null; category: string };

type LearnerAchievementRow = {
  id: string;
  achievement_id: string;
  awarded_at: string;
  evidence_note: string | null;
  achievements: { name: string; icon: string | null } | { name: string; icon: string | null }[] | null;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

type LearnerOption = { id: string; full_name: string };

const categoryLabels: Record<string, string> = {
  lesson_completion: "Lesson Completion",
  competency_mastery: "Competency Mastery",
  timely_submission: "Timely Submission",
  improved_performance: "Improved Performance",
  project_completion: "Project Completion",
  safety_compliance: "Safety Compliance",
  consistent_participation: "Consistent Participation",
  remediation_completion: "Remediation Completion",
  enrichment_completion: "Enrichment Completion",
  teacher_recognition: "Teacher Recognition"
};

export default async function TeacherAchievementsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const [{ data: achievements }, { data: learners }, { data: awarded }] = await Promise.all([
    supabase.from("achievements").select("id, name, description, icon, category").order("created_at", { ascending: false }).returns<AchievementRow[]>(),
    supabase.from("profiles").select("id, full_name").eq("role", "learner").order("full_name").returns<LearnerOption[]>(),
    supabase
      .from("learner_achievements")
      .select("id, achievement_id, awarded_at, evidence_note, achievements(name, icon), profiles(full_name)")
      .order("awarded_at", { ascending: false })
      .limit(30)
      .returns<LearnerAchievementRow[]>()
  ]);

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Achievements" description="Recognize learner progress. Achievements are private to the learner and their teacher — there is no public leaderboard." />

      <FlashMessage message={params.error} variant="error" className="mb-7" />
      <FlashMessage message={params.message} variant="success" className="mb-7" />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <aside className="grid content-start gap-6">
          <section className="card rounded-[1.75rem] p-6 sm:p-7">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">New Achievement Type</h2>
            <form action={createAchievementAction} className="mt-4 grid gap-4">
              <FormInput label="Name" name="name" required placeholder="Safety First" />
              <FormTextarea label="Description" name="description" placeholder="What does this recognize?" />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput label="Icon (emoji)" name="icon" placeholder="🦺" />
                <FormSelect label="Category" name="category" defaultValue="teacher_recognition">
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </FormSelect>
              </div>
              <SubmitButton>Create Achievement Type</SubmitButton>
            </form>
          </section>

          <section className="card rounded-[1.75rem] p-6 sm:p-7">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Award Achievement</h2>
            {achievements?.length && learners?.length ? (
              <form action={awardAchievementAction} className="mt-4 grid gap-4">
                <FormSelect label="Achievement" name="achievement_id" required defaultValue="">
                  <option value="">Select achievement</option>
                  {achievements.map((achievement) => (
                    <option key={achievement.id} value={achievement.id}>{achievement.icon} {achievement.name}</option>
                  ))}
                </FormSelect>
                <FormSelect label="Learner" name="learner_id" required defaultValue="">
                  <option value="">Select learner</option>
                  {learners.map((learner) => (
                    <option key={learner.id} value={learner.id}>{learner.full_name}</option>
                  ))}
                </FormSelect>
                <FormTextarea label="Evidence / Note (optional)" name="evidence_note" placeholder="Why did they earn this?" />
                <SubmitButton>Award Achievement</SubmitButton>
              </form>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Create an achievement type first, and make sure you have learners assigned to your sections.</p>
            )}
          </section>
        </aside>

        <section>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Recently Awarded</h2>
          {!awarded?.length ? (
            <div className="mt-4"><EmptyState title="No achievements awarded yet" message="Awarded achievements will appear here." /></div>
          ) : (
            <div className="mt-4 grid gap-3">
              {awarded.map((entry) => {
                const achievement = firstRelation(entry.achievements);
                const learner = firstRelation(entry.profiles);

                return (
                  <div key={entry.id} className="card flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] p-5">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-slate-100">{achievement?.icon} {achievement?.name} &middot; {learner?.full_name}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Awarded {formatDateTime(entry.awarded_at)}</p>
                      {entry.evidence_note ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{entry.evidence_note}</p> : null}
                    </div>
                    <form action={revokeAchievementAction.bind(null, entry.id)}>
                      <button className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 active:scale-[0.97]">Remove</button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
