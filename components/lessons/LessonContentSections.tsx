import Link from "next/link";
import { LessonBlockRenderer } from "@/components/lessons/LessonBlockRenderer";
import { LessonCompletionControl } from "@/components/lessons/LessonProgressTracker";
import { type LessonBlock, type LessonBlockProgress, type LessonBlockType } from "@/lib/lesson-blocks";

export type LessonAssignment = { id: string; title: string; instructions: string | null; due_at: string | null; submission_type: string };
export type LessonResource = { id: string; title: string; url: string; resource_type: string };
export type LessonExamSummary = { id: string; title: string; durationMinutes: number; attemptsAllowed: number };

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const moduleGroups: Array<{
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
  id,
  eyebrow,
  title,
  description,
  children
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-24 first:mt-0">
      <div className="mb-5 border-l-4 border-teal-500 pl-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-amber-400">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-3xl">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
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

export function LessonContentSections({
  lessonId,
  blocks,
  progressByBlock,
  assignments,
  resources,
  exam,
  interactive,
  legacyContentMd,
  completed
}: {
  lessonId: string;
  blocks: LessonBlock[];
  progressByBlock: Record<string, LessonBlockProgress>;
  assignments: LessonAssignment[];
  resources: LessonResource[];
  exam: LessonExamSummary | null;
  interactive: boolean;
  legacyContentMd?: string | null;
  completed: boolean;
}) {
  const reflectionBlocks = blocks.filter((block) => block.block_type === "reflection");
  const resourceBlocks = blocks.filter((block) => block.block_type === "resources" || block.block_type === "references");
  const groupedTypes = new Set<LessonBlockType>([...moduleGroups.flatMap((group) => group.types), "reflection", "resources", "references"]);
  const legacyBlocks = blocks.filter((block) => !groupedTypes.has(block.block_type));

  return (
    <>
      {blocks.length ? (
        <>
          {moduleGroups.map((group) => {
            const sectionBlocks = blocks.filter((block) => group.types.includes(block.block_type));
            if (!sectionBlocks.length) return null;

            return (
              <ModuleSection key={group.title} id={slugify(group.title)} eyebrow={group.eyebrow} title={group.title} description={group.description}>
                {sectionBlocks.map((block) => (
                  <LessonBlockRenderer key={block.id} block={block} progress={progressByBlock[block.id]} interactive={interactive} />
                ))}
              </ModuleSection>
            );
          })}

          {legacyBlocks.length ? (
            <ModuleSection id={slugify("Additional Lesson Content")} eyebrow="More to Explore" title="Additional Lesson Content" description="Review these supporting notes and references from your teacher.">
              {legacyBlocks.map((block) => (
                <LessonBlockRenderer key={block.id} block={block} progress={progressByBlock[block.id]} interactive={interactive} />
              ))}
            </ModuleSection>
          ) : null}
        </>
      ) : (
        <ModuleSection id={slugify("Explore the Lesson")} eyebrow="Core Lesson" title="Explore the Lesson" description="Read the lesson notes and examples below.">
          <section className="rounded-[1.75rem] bg-slate-50 dark:bg-slate-900/50 p-7 sm:p-9">
            <div className="prose-eim max-w-4xl text-slate-700 dark:text-slate-300">{renderMarkdownLite(legacyContentMd ?? "No content yet.")}</div>
          </section>
        </ModuleSection>
      )}

      {assignments.length ? (
        <ModuleSection id={slugify("Performance Task")} eyebrow="Application" title="Performance Task" description="Demonstrate the skill using the instructions and submission method below.">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-[1.75rem] bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-950 dark:text-slate-100">{assignment.title}</h3>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold capitalize text-slate-600 dark:text-slate-400">{assignment.submission_type.replaceAll("_", " ")}</span>
              </div>
              {assignment.instructions ? <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">{assignment.instructions}</p> : null}
              {assignment.due_at ? <p className="mt-5 text-xs font-semibold text-slate-500 dark:text-slate-400">Due {new Date(assignment.due_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}</p> : null}
            </div>
          ))}
        </ModuleSection>
      ) : null}

      {exam ? (
        <ModuleSection id={slugify("Quiz")} eyebrow="Assessment" title="Quiz" description="Check your understanding with the graded quiz for this topic.">
          <div className="rounded-[1.75rem] bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-7">
            <h3 className="text-xl font-semibold text-slate-950 dark:text-slate-100">{exam.title}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {exam.durationMinutes} minutes &middot; {exam.attemptsAllowed} attempt{exam.attemptsAllowed === 1 ? "" : "s"} allowed
            </p>
            <Link
              href={`/learner/exams/${exam.id}`}
              className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 active:scale-[0.97]"
            >
              Take the Quiz →
            </Link>
          </div>
        </ModuleSection>
      ) : null}

      {reflectionBlocks.length ? (
        <ModuleSection id={slugify("Reflection")} eyebrow="Learning Journal" title="Reflection" description="Connect the lesson to your own practice and identify your next step.">
          {reflectionBlocks.map((block) => (
            <LessonBlockRenderer key={block.id} block={block} progress={progressByBlock[block.id]} interactive={interactive} />
          ))}
        </ModuleSection>
      ) : null}

      {resources.length || resourceBlocks.length ? (
        <ModuleSection id={slugify("Resources")} eyebrow="Further Learning" title="Resources" description="Use these supporting links for review, practice, and further reading.">
          {resourceBlocks.map((block) => (
            <LessonBlockRenderer key={block.id} block={block} />
          ))}
          {resources.length ? (
            <div className="rounded-[1.75rem] bg-teal-50/80 dark:bg-amber-950/40 p-6">
              <div className="grid gap-3">
                {resources.map((resource) => (
                  <div key={resource.id} className="rounded-2xl bg-white/75 dark:bg-slate-900/75 p-4">
                    <p className="font-semibold text-slate-950 dark:text-slate-100">{resource.title}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">{resource.resource_type}</p>
                    <a href={resource.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-2xl border border-teal-200 dark:border-amber-800/50 px-4 py-2 text-sm font-semibold text-teal-700 dark:text-amber-400 hover:bg-teal-50 dark:hover:bg-amber-950/40">
                      Open in New Tab
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </ModuleSection>
      ) : null}

      {interactive ? (
        <div className="mt-12">
          <LessonCompletionControl lessonId={lessonId} initialCompleted={completed} />
        </div>
      ) : null}
    </>
  );
}
