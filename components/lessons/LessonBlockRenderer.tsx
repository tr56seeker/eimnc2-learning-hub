import { EmbeddedResourceViewer } from "@/components/lessons/EmbeddedResourceViewer";
import { ActivityProgressToggle, ChecklistProgress, TextResponseBlock } from "@/components/lessons/InteractiveLessonBlocks";
import { type LessonBlock, type LessonBlockProgress, lessonBlockLabels } from "@/lib/lesson-blocks";

function safeHttpUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function linesFrom(body: string | null) {
  return (body ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function Paragraphs({ body }: { body: string | null }) {
  const paragraphs = linesFrom(body);
  return (
    <>
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="mt-4 leading-8 text-slate-700 dark:text-slate-300">
          {paragraph}
        </p>
      ))}
    </>
  );
}

function ExternalLinkButton({ href, label = "Open in New Tab" }: { href: string | null; label?: string }) {
  const safeHref = safeHttpUrl(href);
  if (!safeHref) return null;

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noreferrer"
      className="mt-5 inline-flex rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:border-teal-200 dark:hover:border-amber-800 hover:text-teal-700 dark:hover:text-amber-400 active:scale-[0.97]"
    >
      {label}
    </a>
  );
}

export function LessonBlockRenderer({
  block,
  progress,
  interactive = false
}: {
  block: LessonBlock;
  progress?: LessonBlockProgress;
  interactive?: boolean;
}) {
  const title = block.title || lessonBlockLabels[block.block_type];
  const blockUrl = safeHttpUrl(block.image_url);

  if (block.block_type === "heading") {
    return (
      <section className="pt-3">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{title}</h2>
        <Paragraphs body={block.body} />
      </section>
    );
  }

  if (block.block_type === "paragraph") {
    return (
      <section className="max-w-4xl">
        <Paragraphs body={block.body} />
      </section>
    );
  }

  if (block.block_type === "image") {
    return (
      <figure className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 dark:border-slate-700/80 bg-white/85 dark:bg-slate-900/85 p-3 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
        {blockUrl ? (
          <img src={blockUrl} alt={block.alt_text ?? block.caption ?? ""} className="max-h-[520px] w-full rounded-[1.35rem] object-cover" />
        ) : (
          <div className="grid min-h-52 place-items-center rounded-[1.35rem] bg-slate-100 dark:bg-slate-800 text-sm text-slate-500 dark:text-slate-400">Image URL missing</div>
        )}
        {block.caption ? <figcaption className="px-2 pt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{block.caption}</figcaption> : null}
      </figure>
    );
  }

  if (block.block_type === "definition") {
    return (
      <section className="rounded-[1.5rem] border border-teal-100 dark:border-amber-900/50 bg-teal-50/80 dark:bg-amber-950/30 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-amber-400">Definition</p>
        <h3 className="mt-2 text-xl font-semibold text-teal-950 dark:text-amber-200">{title}</h3>
        <Paragraphs body={block.body} />
      </section>
    );
  }

  if (block.block_type === "safety") {
    return (
      <section className="rounded-[1.5rem] border border-amber-200 dark:border-amber-800/50 bg-amber-50/90 dark:bg-amber-950/30 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Safety Reminder</p>
        <h3 className="mt-2 text-xl font-semibold text-amber-950 dark:text-amber-200">{title}</h3>
        <Paragraphs body={block.body} />
      </section>
    );
  }

  if (block.block_type === "procedure") {
    const steps = linesFrom(block.body);
    return (
      <section className="rounded-[1.5rem] border border-slate-200/80 dark:border-slate-700/80 bg-white/85 dark:bg-slate-900/85 p-6 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
        <h3 className="text-xl font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
        <ol className="mt-5 grid gap-4">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-4 rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 leading-7 text-slate-700 dark:text-slate-300">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-semibold text-white">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  if (block.block_type === "tools_materials") {
    const items = linesFrom(block.body);
    return (
      <section className="rounded-[1.5rem] border border-slate-200/80 dark:border-slate-700/80 bg-white/85 dark:bg-slate-900/85 p-6 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
        <h3 className="text-xl font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 text-sm font-medium text-slate-700 dark:text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.block_type === "formula") {
    return (
      <section className="rounded-[1.5rem] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">Formula</p>
        <h3 className="mt-2 text-xl font-semibold">{title}</h3>
        <pre className="mt-5 overflow-x-auto rounded-2xl bg-white/10 p-4 text-sm leading-7 text-slate-100">{block.body}</pre>
      </section>
    );
  }

  if (block.block_type === "objectives") {
    const objectives = linesFrom(block.body);
    return (
      <section className="rounded-[1.5rem] border border-teal-100 dark:border-amber-900/50 bg-teal-50/70 dark:bg-amber-950/30 p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-amber-400">Learning Objectives</p>
        <h3 className="mt-2 text-xl font-semibold text-teal-950 dark:text-amber-200">{title}</h3>
        <ul className="mt-5 grid gap-3">
          {objectives.map((objective, index) => (
            <li key={`${objective}-${index}`} className="flex gap-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 p-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-600" />
              <span>{objective}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (block.block_type === "embed") {
    return (
      <section className="rounded-[1.5rem] border border-slate-200/80 dark:border-slate-700/80 bg-white/85 dark:bg-slate-900/85 p-6 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
        <h3 className="text-xl font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
        <EmbeddedResourceViewer title={title} url={block.image_url} caption={block.caption} blockType={block.block_type} />
      </section>
    );
  }

  if (block.block_type === "video") {
    return (
      <section className="rounded-[1.5rem] border border-slate-200/80 dark:border-slate-700/80 bg-white/85 dark:bg-slate-900/85 p-6 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-amber-400">Lesson Video</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
        <EmbeddedResourceViewer title={title} url={block.image_url} caption={block.caption} blockType={block.block_type} />
      </section>
    );
  }

  if (block.block_type === "module") {
    return (
      <section className="rounded-[1.5rem] border border-slate-200/80 dark:border-slate-700/80 bg-white/85 dark:bg-slate-900/85 p-6 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-amber-400">{lessonBlockLabels.module}</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
        <Paragraphs body={block.body} />
        <EmbeddedResourceViewer title={title} url={block.image_url} caption={block.caption} blockType={block.block_type} />
      </section>
    );
  }

  if (block.block_type === "module_pdf") {
    return (
      <section className="rounded-[1.5rem] border border-slate-200/80 dark:border-slate-700/80 bg-white/85 dark:bg-slate-900/85 p-6 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-amber-400">Module PDF</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
        <EmbeddedResourceViewer title={title} url={block.image_url} caption={block.caption} blockType={block.block_type} />
      </section>
    );
  }

  if (block.block_type === "activity") {
    return (
      <section className="rounded-[1.5rem] border border-slate-200/80 dark:border-slate-700/80 bg-white/85 dark:bg-slate-900/85 p-6 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-amber-400">{lessonBlockLabels.activity}</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
        <Paragraphs body={block.body ?? block.caption} />
        <div className="flex flex-wrap items-center">
          <ExternalLinkButton href={block.image_url} label="Open Activity Link" />
          {interactive ? <ActivityProgressToggle blockId={block.id} lessonId={block.lesson_id} initialCompleted={progress?.completed ?? false} /> : null}
        </div>
      </section>
    );
  }

  if (block.block_type === "checklist") {
    const items = linesFrom(block.body);
    return (
      <section className="rounded-[1.5rem] border border-sky-100 dark:border-sky-900/50 bg-sky-50/70 dark:bg-sky-950/30 p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-400">Preparation Checklist</p>
        <h3 className="mt-2 text-xl font-semibold text-sky-950 dark:text-sky-200">{title}</h3>
        {interactive ? (
          <ChecklistProgress blockId={block.id} lessonId={block.lesson_id} items={items} initialChecked={progress?.response?.checked ?? []} />
        ) : (
          <ul className="mt-5 grid gap-3">
            {items.map((item, index) => (
              <li key={`${item}-${index}`} className="flex items-start gap-3 rounded-2xl bg-white/75 dark:bg-slate-900/75 p-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
                <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-900" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  if (block.block_type === "quick_question") {
    return (
      <section className="rounded-[1.5rem] border border-violet-100 dark:border-violet-900/50 bg-violet-50/75 dark:bg-violet-950/30 p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-400">Quick Question</p>
        <h3 className="mt-2 text-xl font-semibold text-violet-950 dark:text-violet-200">{title}</h3>
        <Paragraphs body={block.body} />
        {interactive ? (
          <TextResponseBlock
            blockId={block.id}
            lessonId={block.lesson_id}
            initialText={progress?.response?.text ?? ""}
            initialCompleted={progress?.completed ?? false}
            placeholder="Type your answer here..."
            submitLabel="Save My Answer"
          />
        ) : null}
      </section>
    );
  }

  if (block.block_type === "reflection") {
    return (
      <section className="rounded-[1.5rem] border border-amber-100 dark:border-amber-900/50 bg-amber-50/75 dark:bg-amber-950/30 p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Reflection Prompt</p>
        <h3 className="mt-2 text-xl font-semibold text-amber-950 dark:text-amber-200">{title}</h3>
        <Paragraphs body={block.body} />
        {interactive ? (
          <TextResponseBlock
            blockId={block.id}
            lessonId={block.lesson_id}
            initialText={progress?.response?.text ?? ""}
            initialCompleted={progress?.completed ?? false}
            placeholder="Write your reflection here..."
            submitLabel="Save My Reflection"
            rows={4}
          />
        ) : null}
      </section>
    );
  }

  if (block.block_type === "glossary" || block.block_type === "references" || block.block_type === "resources") {
    const items = linesFrom(block.body);
    return (
      <section className="rounded-[1.5rem] border border-slate-200/80 dark:border-slate-700/80 bg-white/85 dark:bg-slate-900/85 p-6 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-amber-400">{lessonBlockLabels[block.block_type]}</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
        <ul className="mt-5 grid gap-3">
          {items.map((item) => (
            <li key={item} className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {item}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return null;
}
