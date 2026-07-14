"use client";

import { useState, useTransition } from "react";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { LessonBlockForm } from "@/components/lessons/LessonBlockForm";
import { lessonBlockLabels, type LessonBlock } from "@/lib/lesson-blocks";
import {
  deleteLessonBlockAction,
  reorderLessonBlocksAction,
  updateLessonBlockAction
} from "@/app/teacher/lessons/[id]/studio/actions";

export function LessonBlockList({ lessonId, blocks }: { lessonId: string; blocks: LessonBlock[] }) {
  const [orderedBlocks, setOrderedBlocks] = useState(blocks);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function moveBlock(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;

    setOrderedBlocks((current) => {
      const next = [...current];
      const sourceIndex = next.findIndex((block) => block.id === sourceId);
      const targetIndex = next.findIndex((block) => block.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return current;

      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);

      startTransition(() => {
        reorderLessonBlocksAction(lessonId, next.map((block) => block.id));
      });

      return next;
    });
  }

  if (!orderedBlocks.length) {
    return (
      <div className="px-6 py-14 text-center">
        <p className="font-semibold text-slate-700">No content blocks yet</p>
        <p className="mt-2 text-sm text-slate-500">Start with objectives, a heading, or a paragraph to shape this lesson.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200/70">
      {orderedBlocks.map((block, index) => (
        <div
          key={block.id}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (draggingId && draggingId !== block.id) moveBlock(draggingId, block.id);
            setDraggingId(null);
          }}
          className={draggingId === block.id ? "opacity-50" : undefined}
        >
          <details className="group">
            <summary className="cursor-pointer list-none px-5 py-4 hover:bg-slate-50/80 sm:px-6">
              <div className="flex items-start gap-3">
                <span
                  draggable
                  onDragStart={(event) => {
                    event.stopPropagation();
                    setDraggingId(block.id);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  role="button"
                  aria-label={`Drag to reorder ${lessonBlockLabels[block.block_type]} block`}
                  className="mt-0.5 cursor-grab select-none text-lg leading-none text-slate-400 hover:text-slate-600"
                >
                  ⠿
                </span>
                <span className="mt-0.5 min-w-10 rounded-lg bg-slate-100 px-2 py-1 text-center text-[11px] font-semibold text-slate-500">#{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-teal-700">{lessonBlockLabels[block.block_type]}</span>
                    <span className={block.is_active === false ? "rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700" : "rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"}>
                      {block.is_active === false ? "Inactive" : "Active"}
                    </span>
                  </div>
                  <h3 className="mt-2 truncate text-sm font-semibold text-slate-950">{block.title || block.caption || "Untitled block"}</h3>
                  <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-slate-500">{block.body || block.image_url || "No preview content."}</p>
                </div>
                <span aria-hidden="true" className="mt-2 text-sm font-semibold text-slate-400 transition group-open:rotate-180">⌄</span>
              </div>
            </summary>

            <div className="grid gap-5 border-t border-slate-100 bg-slate-50/65 px-5 py-5 sm:px-6">
              <LessonBlockForm action={updateLessonBlockAction.bind(null, lessonId, block.id)} block={block} submitLabel="Save Block Changes" />
              <form action={deleteLessonBlockAction.bind(null, lessonId, block.id)}>
                <ConfirmSubmitButton message="Delete this lesson block?" className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">
                  Delete Block
                </ConfirmSubmitButton>
              </form>
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}
