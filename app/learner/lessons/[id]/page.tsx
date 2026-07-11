import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LessonBlockRenderer } from "@/components/lessons/LessonBlockRenderer";
import { PortalShell } from "@/components/PortalShell";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { type LessonBlock, type LessonBlockType } from "@/lib/lesson-blocks";
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

type AssignmentRow = {
  id: string;
  title: string;
  instructions: string | null;
  due_at: string | null;
  submission_type: string;
};

const moduleGroups: Array<{
  eyebrow: string;
  title: string;
  description: string;
  types: LessonBlockType[];
}> = [
  {
    eyebrow: "Learning Goals",
    title: "What You Will Learn",
    description: "Use these objectives to focus your reading and practice.",
    types: ["objectives"]
  },
  {
    eyebrow: "Preparation",
    title: "Before You Start",
    description: "Review the safety reminders, required tools, and preparation checklist.",
    types: ["safety", "checklist", "tools_materials"]
  },
  {
    eyebrow: "Core Lesson",
    title: "Explore the Lesson",
    description: "Read the explanation, study the examples, and follow each procedure carefully.",
    types: ["heading", "paragraph", "image", "definition", "procedure", "formula", "glossary"]
  },
  {
    eyebrow: "Interactive Resources",
    title: "PowerPoint, Video, and Module",
    description: "View and interact with the lesson media without leaving the learning hub.",
    types: ["video", "embed", "module", "module_pdf"]
  },
  {
    eyebrow: "Guided Practice",
    title: "Try This",
    description: "Apply the lesson through the activity prepared by your teacher.",
    types: ["activity"]
  },
  {
    eyebrow: "Knowledge Check",
    title: "Check Your Understanding",
    description: "Pause and answer these questions before moving forward.",
    types: ["quick_question"]
  }
];

function ModuleSection({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="mb-5 border-l-4 border-teal-500 pl-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <div className="grid gap-6">{children}</div>
    </section>
  );
}

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

  const [blocksResult, resourcesResult, assignmentsResult] = await Promise.all([
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
      .eq("lesson_id", id),
    supabase
      .from("assignments")
      .select("id, title, instructions, due_at, submission_type")
      .eq("lesson_id", id)
      .order("created_at")
      .returns<AssignmentRow[]>()
  ]);

  const blocks = blocksResult.data ?? [];
  const resources = resourcesResult.data ?? [];
  const assignments = assignmentsResult.data ?? [];
  const reflectionBlocks = blocks.filter((block) => block.block_type === "reflection");
  const resourceBlocks = blocks.filter((block) => block.block_type === "resources" || block.block_type === "references");
  const groupedTypes = new Set<LessonBlockType>([
    ...moduleGroups.flatMap((group) => group.types),
    "reflection",
    "resources",
    "references"
  ]);
  const legacyBlocks = blocks.filter((block) => !groupedTypes.has(block.block_type));

  return (
    <PortalShell profile={profile}>
      <article className="mx-auto max-w-6xl">
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

        {blocks.length ? (
          <>
            {moduleGroups.map((group) => {
              const sectionBlocks = blocks.filter((block) => group.types.includes(block.block_type));
              if (!sectionBlocks.length) return null;

              return (
                <ModuleSection key={group.title} eyebrow={group.eyebrow} title={group.title} description={group.description}>
                  {sectionBlocks.map((block) => <LessonBlockRenderer key={block.id} block={block} />)}
                </ModuleSection>
              );
            })}

            {legacyBlocks.length ? (
              <ModuleSection eyebrow="More to Explore" title="Additional Lesson Content" description="Review these supporting notes and references from your teacher.">
                {legacyBlocks.map((block) => <LessonBlockRenderer key={block.id} block={block} />)}
              </ModuleSection>
            ) : null}
          </>
        ) : (
          <ModuleSection eyebrow="Core Lesson" title="Explore the Lesson" description="Read the lesson notes and examples below.">
            <section className="card rounded-[1.75rem] p-7 sm:p-9">
              <div className="prose-eim max-w-4xl text-slate-700">{renderMarkdownLite(lesson.content_md ?? "No content yet.")}</div>
            </section>
          </ModuleSection>
        )}

        {assignments.length ? (
          <ModuleSection eyebrow="Application" title="Performance Task" description="Demonstrate the skill using the instructions and submission method below.">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-xl font-semibold text-slate-950">{assignment.title}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{assignment.submission_type.replaceAll("_", " ")}</span>
                </div>
                {assignment.instructions ? <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">{assignment.instructions}</p> : null}
                {assignment.due_at ? <p className="mt-5 text-xs font-semibold text-slate-500">Due {new Date(assignment.due_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}</p> : null}
              </div>
            ))}
          </ModuleSection>
        ) : null}

        {reflectionBlocks.length ? (
          <ModuleSection eyebrow="Learning Journal" title="Reflection" description="Connect the lesson to your own practice and identify your next step.">
            {reflectionBlocks.map((block) => <LessonBlockRenderer key={block.id} block={block} />)}
          </ModuleSection>
        ) : null}

        {resources.length || resourceBlocks.length ? (
          <ModuleSection eyebrow="Further Learning" title="Resources" description="Use these supporting links for review, practice, and further reading.">
            {resourceBlocks.map((block) => <LessonBlockRenderer key={block.id} block={block} />)}
            {resources.length ? (
              <div className="rounded-[1.75rem] border border-teal-100/80 bg-teal-50/80 p-6">
                <div className="grid gap-3">
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
              </div>
            ) : null}
          </ModuleSection>
        ) : null}
      </article>
    </PortalShell>
  );
}
