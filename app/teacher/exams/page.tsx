import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export default async function TeacherExamsPage() {
  const { profile, supabase } = await requireTeacher();

  const { data: exams } = await supabase
    .from("exams")
    .select("id, title, description, status, duration_minutes, start_at, end_at, competencies(code, title)")
    .order("created_at", { ascending: false });

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Exam Manager" description="The MVP includes published seeded exams. Full exam builder with question import is recommended for Phase 2." />

      <div className="grid gap-4 md:grid-cols-2">
        {(exams ?? []).map((exam) => (
          <div key={exam.id} className="card rounded-3xl p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">{exam.competencies?.code ?? "EIM"}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{exam.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{exam.description}</p>
            <div className="mt-5 grid gap-2 text-sm text-slate-500">
              <p><strong>Status:</strong> {exam.status}</p>
              <p><strong>Duration:</strong> {exam.duration_minutes} minutes</p>
              <p><strong>Opens:</strong> {formatDateTime(exam.start_at)}</p>
              <p><strong>Closes:</strong> {formatDateTime(exam.end_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
