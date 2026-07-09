import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireTeacher } from "@/lib/auth";
import { firstRelation } from "@/lib/relations";
import { createLessonAction } from "./actions";

const inputClass = "focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 font-normal shadow-sm";
const textareaClass = "focus-ring rounded-2xl border border-slate-200/80 bg-white/80 p-4 font-normal shadow-sm";

export default async function TeacherLessonsPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const [lessonsResult, competenciesResult] = await Promise.all([
    supabase.from("lessons").select("id, title, published, competencies(code, title)").order("created_at", { ascending: false }),
    supabase.from("competencies").select("id, code, title").order("order_index")
  ]);

  return (
    <PortalShell profile={profile}>
      <SectionHeader eyebrow="Teacher" title="Lesson Manager" description="Create and publish EIM competency-based lessons." />

      {params.message ? <div className="mb-5 rounded-2xl border border-teal-200 bg-teal-50 p-4 font-bold text-teal-800">{params.message}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="card rounded-[2rem] p-6">
          <h2 className="text-xl font-black tracking-tight text-slate-950">Create Lesson</h2>
          <form action={createLessonAction} className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Competency
              <select name="competency_id" className={inputClass}>
                <option value="">Select competency</option>
                {(competenciesResult.data ?? []).map((competency) => (
                  <option key={competency.id} value={competency.id}>{competency.code} - {competency.title}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Title
              <input name="title" required className={inputClass} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Summary
              <textarea name="summary" rows={3} className={textareaClass} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Lesson content
              <textarea name="content_md" rows={8} className={textareaClass} placeholder="Use ## headings and - bullets" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Estimated minutes
              <input name="estimated_minutes" type="number" defaultValue={45} className={inputClass} />
            </label>
            <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <input name="published" type="checkbox" /> Publish now
            </label>
            <button className="rounded-2xl bg-slate-950 px-5 py-3.5 font-black text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">Save Lesson</button>
          </form>
        </section>

        <section className="card rounded-[2rem] p-6">
          <h2 className="text-xl font-black tracking-tight text-slate-950">Existing Lessons</h2>
          <div className="mt-5 grid gap-3">
            {(lessonsResult.data ?? []).map((lesson) => {
              const competency = firstRelation(lesson.competencies);

              return (
                <div key={lesson.id} className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
                  <p className="text-xs font-black tracking-[0.18em] text-teal-700">{competency?.code ?? "EIM"}</p>
                  <h3 className="mt-1 font-black text-slate-950">{lesson.title}</h3>
                  <p className="mt-1 text-sm font-bold text-slate-500">{lesson.published ? "Published" : "Draft"}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
