import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LessonBlockRenderer } from "@/components/lessons/LessonBlockRenderer";
import { PortalShell } from "@/components/PortalShell";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { type LessonBlock } from "@/lib/lesson-blocks";
import { firstRelation } from "@/lib/relations";

type LessonRow = {
  id: string;
  title: string;
  summary: string | null;
  content_md: string | null;
  estimated_minutes: number | null;
  published: boolean;
  competencies: { code: string | null; title: string | null } | { code: string | null; title: string | null }[] | null;
};

function renderMarkdownLite(markdown: string) {
  const lines = markdown.split("\n");
  return lines.map((line, index) => {
    if (line.startsWith("### ")) return <h3 key={index}>{line.replace("### ", "")}</h3>;
    if (line.startsWith("## ")) return <h2 key={index}>{line.replace("## ", "")}</h2>;
    if (line.startsWith("- ")) return <li key={index}>{line.replace("- ", "")}</li>;
    if (!line.trim()) return <br key={index} />;
    return <p key={index}>{line}</p>;
  });
}

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, supabase } = await getCurrentUserAndProfile();
  if (profile.role === "learner" && profile.must_change_password) {
    redirect("/account/change-password");
  }

  const isTeacherPreview = profile.role === "teacher" || profile.role === "admin";

  let lessonQuery = supabase
    .from("lessons")
    .select("id, title, summary, content_md, estimated_minutes, published, competencies(code, title)")
    .eq("id", id);

  if (!isTeacherPreview) {
    lessonQuery = lessonQuery.eq("published", true);
  }

  const { data: lesson } = await lessonQuery.single().returns<LessonRow>();

  if (!lesson) notFound();

  const competency = firstRelation(lesson.competencies);

  const [blocksResult, resourcesResult] = await Promise.all([
    supabase
      .from("lesson_blocks")
      .select("id, lesson_id, block_type, title, body, image_url, caption, alt_text, metadata, display_order, is_active, created_at, updated_at")
      .eq("lesson_id", id)
      .eq("is_active", true)
      .order("display_order")
      .order("created_at")
      .returns<LessonBlock[]>(),
    supabase
      .from("lesson_resources")
      .select("id, title, url, resource_type")
      .eq("lesson_id", id)
  ]);

  const blocks = blocksResult.data ?? [];
  const resources = resourcesResult.data ?? [];

  return (
    <PortalShell profile={profile}>
      <article className="mx-auto max-w-5xl">
        <header className="rounded-3xl border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,253,250,0.88)_48%,rgba(239,246,255,0.86))] p-7 shadow-xl shadow-slate-200/50 sm:p-10">
          <Link href={isTeacherPreview ? `/teacher/lessons/${id}/studio` : "/learner/lessons"} className="text-sm font-semibold text-teal-700 hover:text-teal-800">
            {isTeacherPreview ? "Back to Studio" : "Back to lessons"}
          </Link>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              {competency?.code ?? "EIM"}
            </span>
            {isTeacherPreview ? (
              <span className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600">
                Teacher Preview / {lesson.published ? "Published" : "Draft"}
              </span>
            ) : null}
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">{lesson.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{lesson.summary}</p>
          <p className="mt-6 text-sm font-medium text-slate-500">{lesson.estimated_minutes ?? 45} minute lesson</p>
        </header>

        <div className="mt-10 grid gap-7">
          {blocks.length ? (
            blocks.map((block) => <LessonBlockRenderer key={block.id} block={block} />)
          ) : (
            <section className="card rounded-[1.75rem] p-7 sm:p-9">
              <div className="prose-eim max-w-4xl text-slate-700">
                {renderMarkdownLite(lesson.content_md ?? "No content yet.")}
              </div>
            </section>
          )}
        </div>

        {resources.length ? (
          <section className="mt-10 rounded-[1.75rem] border border-teal-100/80 bg-teal-50/80 p-6">
            <h2 className="text-xl font-semibold text-teal-950">Resources</h2>
            <div className="mt-5 grid gap-3">
              {resources.map((resource) => (
                <div key={resource.id} className="rounded-2xl bg-white/75 p-4 shadow-sm shadow-teal-100/50">
                  <p className="font-semibold text-slate-950">{resource.title}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{resource.resource_type}</p>
                  <a href={resource.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-2xl border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50">
                    Open in New Tab
                  </a>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </PortalShell>
  );
}
