import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { requireLearner } from "@/lib/auth";

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
  const { profile, supabase } = await requireLearner();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, summary, content_md, estimated_minutes, competencies(code, title)")
    .eq("id", id)
    .eq("published", true)
    .single();

  if (!lesson) notFound();

  const { data: resources } = await supabase
    .from("lesson_resources")
    .select("id, title, url, resource_type")
    .eq("lesson_id", id);

  return (
    <PortalShell profile={profile}>
      <article className="card rounded-[2rem] p-6 sm:p-8">
        <Link href="/learner/lessons" className="text-sm font-bold text-teal-700">← Back to lessons</Link>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-teal-700">{lesson.competencies?.code ?? "EIM"}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{lesson.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{lesson.summary}</p>
        <div className="prose-eim mt-8 max-w-4xl text-slate-700">
          {renderMarkdownLite(lesson.content_md ?? "No content yet.")}
        </div>

        {resources?.length ? (
          <div className="mt-8 rounded-3xl bg-teal-50 p-5 ring-1 ring-teal-100">
            <h2 className="font-black text-teal-950">Resources</h2>
            <div className="mt-3 grid gap-2">
              {resources.map((resource) => (
                <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" className="font-bold text-teal-700 hover:underline">
                  {resource.title} <span className="text-xs uppercase text-slate-400">{resource.resource_type}</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </article>
    </PortalShell>
  );
}
