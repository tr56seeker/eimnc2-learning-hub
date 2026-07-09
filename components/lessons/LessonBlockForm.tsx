"use client";

import { useState } from "react";
import { lessonBlockLabels, lessonBlockTypes, type LessonBlock, type LessonBlockType } from "@/lib/lesson-blocks";

type LessonBlockFormProps = {
  action: (formData: FormData) => void;
  block?: LessonBlock;
  submitLabel: string;
};

const inputClass = "focus-ring min-h-12 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 font-normal text-slate-900 shadow-sm shadow-slate-200/40";
const textareaClass = "focus-ring rounded-2xl border border-slate-200/80 bg-white/90 p-4 font-normal text-slate-900 shadow-sm shadow-slate-200/40";
const labelClass = "grid gap-2.5 text-sm font-semibold text-slate-700";

function usesTitle(type: LessonBlockType) {
  return type !== "paragraph" && type !== "image";
}

function usesBody(type: LessonBlockType) {
  return type !== "image" && type !== "embed" && type !== "module";
}

function usesUrl(type: LessonBlockType) {
  return type === "image" || type === "embed" || type === "module";
}

function usesCaption(type: LessonBlockType) {
  return type === "image" || type === "embed" || type === "module";
}

export function LessonBlockForm({ action, block, submitLabel }: LessonBlockFormProps) {
  const [blockType, setBlockType] = useState<LessonBlockType>(block?.block_type ?? "paragraph");

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-5 md:grid-cols-[1fr_160px_160px]">
        <label className={labelClass}>
          Block type
          <select
            name="block_type"
            value={blockType}
            onChange={(event) => setBlockType(event.target.value as LessonBlockType)}
            className={inputClass}
          >
            {lessonBlockTypes.map((type) => (
              <option key={type} value={type}>
                {lessonBlockLabels[type]}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Order
          <input name="display_order" type="number" defaultValue={block?.display_order ?? 0} className={inputClass} />
        </label>
        <label className="flex items-center gap-3 self-end rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-sm font-medium text-slate-700">
          <input name="is_active" type="checkbox" defaultChecked={block?.is_active ?? true} /> Active
        </label>
      </div>

      {usesTitle(blockType) ? (
        <label className={labelClass}>
          Title
          <input name="title" defaultValue={block?.title ?? ""} className={inputClass} placeholder="Optional block title" />
        </label>
      ) : null}

      {usesBody(blockType) ? (
        <label className={labelClass}>
          Body
          <textarea
            name="body"
            rows={blockType === "paragraph" ? 6 : 4}
            defaultValue={block?.body ?? ""}
            className={textareaClass}
            placeholder="Use one line per step, item, glossary term, or reference when helpful."
          />
        </label>
      ) : null}

      {usesUrl(blockType) ? (
        <label className={labelClass}>
          URL
          <input
            name="image_url"
            type="url"
            defaultValue={block?.image_url ?? ""}
            className={inputClass}
            placeholder="https://..."
          />
        </label>
      ) : null}

      {blockType === "image" ? (
        <label className={labelClass}>
          Alt text
          <input name="alt_text" defaultValue={block?.alt_text ?? ""} className={inputClass} placeholder="Describe the image for accessibility" />
        </label>
      ) : null}

      {usesCaption(blockType) ? (
        <label className={labelClass}>
          Caption / link description
          <textarea name="caption" rows={2} defaultValue={block?.caption ?? ""} className={textareaClass} />
        </label>
      ) : null}

      <button className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">
        {submitLabel}
      </button>
    </form>
  );
}
