import { type LessonBlock, lessonBlockLabels } from "@/lib/lesson-blocks";

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
        <p key={paragraph} className="mt-4 leading-8 text-slate-700">
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
      className="mt-5 inline-flex rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-teal-200 hover:text-teal-700"
    >
      {label}
    </a>
  );
}

function EmbedFrame({ url, title }: { url: string | null; title: string }) {
  const safeUrl = safeHttpUrl(url);
  if (!safeUrl) return null;

  return (
    <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-slate-50 shadow-sm">
      <iframe
        src={safeUrl}
        title={title}
        loading="lazy"
        sandbox="allow-same-origin allow-scripts allow-presentation"
        className="aspect-video w-full"
      />
    </div>
  );
}

export function LessonBlockRenderer({ block }: { block: LessonBlock }) {
  const title = block.title || lessonBlockLabels[block.block_type];
  const blockUrl = safeHttpUrl(block.image_url);

  if (block.block_type === "heading") {
    return (
      <section className="pt-3">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
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
      <figure className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-3 shadow-sm shadow-slate-200/50">
        {blockUrl ? (
          <img src={blockUrl} alt={block.alt_text ?? block.caption ?? ""} className="max-h-[520px] w-full rounded-[1.35rem] object-cover" />
        ) : (
          <div className="grid min-h-52 place-items-center rounded-[1.35rem] bg-slate-100 text-sm text-slate-500">Image URL missing</div>
        )}
        {block.caption ? <figcaption className="px-2 pt-3 text-sm leading-6 text-slate-500">{block.caption}</figcaption> : null}
      </figure>
    );
  }

  if (block.block_type === "definition") {
    return (
      <section className="rounded-[1.5rem] border border-teal-100 bg-teal-50/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Definition</p>
        <h3 className="mt-2 text-xl font-semibold text-teal-950">{title}</h3>
        <Paragraphs body={block.body} />
      </section>
    );
  }

  if (block.block_type === "safety") {
    return (
      <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50/90 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Safety Reminder</p>
        <h3 className="mt-2 text-xl font-semibold text-amber-950">{title}</h3>
        <Paragraphs body={block.body} />
      </section>
    );
  }

  if (block.block_type === "procedure") {
    const steps = linesFrom(block.body);
    return (
      <section className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-6 shadow-sm shadow-slate-200/50">
        <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
        <ol className="mt-5 grid gap-4">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-4 rounded-2xl bg-slate-50 p-4 leading-7 text-slate-700">
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
      <section className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-6 shadow-sm shadow-slate-200/50">
        <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-700">
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

  if (block.block_type === "embed") {
    return (
      <section className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-6 shadow-sm shadow-slate-200/50">
        <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
        {block.caption ? <p className="mt-3 text-sm leading-6 text-slate-500">{block.caption}</p> : null}
        <EmbedFrame url={block.image_url} title={title} />
        <ExternalLinkButton href={block.image_url} />
      </section>
    );
  }

  if (block.block_type === "module" || block.block_type === "activity") {
    return (
      <section className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-6 shadow-sm shadow-slate-200/50">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{lessonBlockLabels[block.block_type]}</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">{title}</h3>
        <Paragraphs body={block.body ?? block.caption} />
        {block.block_type === "module" ? <EmbedFrame url={block.image_url} title={title} /> : null}
        <ExternalLinkButton href={block.image_url} label={block.block_type === "module" ? "Open Module" : "Open Activity Link"} />
      </section>
    );
  }

  if (block.block_type === "glossary" || block.block_type === "references") {
    const items = linesFrom(block.body);
    return (
      <section className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-6 shadow-sm shadow-slate-200/50">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{lessonBlockLabels[block.block_type]}</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">{title}</h3>
        <ul className="mt-5 grid gap-3">
          {items.map((item) => (
            <li key={item} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return null;
}
