import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { requireTeacher } from "@/lib/auth";
import { percent } from "@/lib/format";

export default async function TeacherGradebookPage() {
  const { profile, supabase } = await requireTeacher();

  const { data: grades } = await supabase
    .from("grades")
    .select("id, title, component, score, max_score, created_at, profiles(full_name, lrn)")
    .order("created_at", { ascending: false });

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Gradebook" description="Monitor encoded grades. Export to Excel is recommended for Phase 2." />

      {!grades?.length ? (
        <EmptyState title="No grades encoded" message="Exam scores and checked outputs will appear here." />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">Learner</th>
                <th className="p-4">Activity</th>
                <th className="p-4">Component</th>
                <th className="p-4">Score</th>
                <th className="p-4">Mastery</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => (
                <tr key={grade.id} className="border-t border-slate-100">
                  <td className="p-4 font-bold text-slate-900">{grade.profiles?.full_name}</td>
                  <td className="p-4 text-slate-700">{grade.title}</td>
                  <td className="p-4 capitalize text-slate-600">{grade.component.replaceAll("_", " ")}</td>
                  <td className="p-4 font-bold">{grade.score}/{grade.max_score}</td>
                  <td className="p-4 font-black text-teal-700">{percent(Number(grade.score), Number(grade.max_score))}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalShell>
  );
}
