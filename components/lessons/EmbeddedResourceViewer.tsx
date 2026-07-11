"use client";

import { useEffect, useRef, useState } from "react";
import { extractEmbedSrc } from "@/lib/lesson-blocks";

type EmbeddedResourceViewerProps = {
  title: string | null;
  url: string | null;
  caption: string | null;
  blockType: string;
};

export function EmbeddedResourceViewer({ title, url, caption, blockType }: EmbeddedResourceViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState("");
  const embedUrl = extractEmbedSrc(url ?? "");
  const iframeTitle = title?.trim() || "Embedded lesson resource";
  const showPowerPointHelp = blockType === "powerpoint" || blockType === "embed";

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === viewerRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    const viewer = viewerRef.current;

    if (document.fullscreenElement === viewer) {
      await document.exitFullscreen();
      return;
    }

    if (!viewer || !document.fullscreenEnabled || typeof viewer.requestFullscreen !== "function") {
      setFullscreenMessage("Fullscreen is not supported by this browser. You can still open the resource in a new tab.");
      return;
    }

    try {
      setFullscreenMessage("");
      await viewer.requestFullscreen();
    } catch {
      setFullscreenMessage("Fullscreen could not be opened. You can still open the resource in a new tab.");
    }
  }

  return (
    <div
      ref={viewerRef}
      className={
        isFullscreen
          ? "flex h-screen w-screen flex-col overflow-hidden bg-slate-950 p-3 sm:p-5"
          : "mt-5 w-full overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-slate-50 p-3 shadow-sm"
      }
    >
      {caption ? (
        <p className={isFullscreen ? "mb-3 text-sm leading-6 text-slate-200" : "mb-3 px-2 text-sm leading-6 text-slate-500"}>{caption}</p>
      ) : null}

      <div
        className={
          isFullscreen
            ? "min-h-0 flex-1 overflow-hidden rounded-2xl bg-white"
            : "aspect-video w-full overflow-hidden rounded-2xl bg-slate-100 lg:min-h-[520px]"
        }
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={iframeTitle}
            className="h-full w-full rounded-2xl border-0"
            allow="fullscreen; autoplay; clipboard-write; encrypted-media"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="grid h-full min-h-64 place-items-center px-6 text-center text-sm text-slate-500">
            This embedded resource does not have a valid URL.
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-1 pt-4">
        <button
          type="button"
          onClick={toggleFullscreen}
          disabled={!embedUrl}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
        {embedUrl ? (
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={
              isFullscreen
                ? "inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-slate-400 hover:bg-white/10"
                : "inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:text-teal-700"
            }
          >
            Open in New Tab
          </a>
        ) : null}
      </div>

      {showPowerPointHelp ? (
        <p className={isFullscreen ? "px-1 pt-3 text-xs leading-5 text-slate-300" : "px-1 pt-3 text-xs leading-5 text-slate-500"}>
          If the presentation does not respond inside the frame, use the fullscreen button or open it in a new tab.
        </p>
      ) : (
        <p className={isFullscreen ? "px-1 pt-3 text-xs leading-5 text-slate-300" : "px-1 pt-3 text-xs leading-5 text-slate-500"}>
          If this resource is blocked by its provider, open it in a new tab.
        </p>
      )}

      {fullscreenMessage ? (
        <p role="status" className={isFullscreen ? "px-1 pt-2 text-xs leading-5 text-amber-200" : "px-1 pt-2 text-xs leading-5 text-amber-700"}>
          {fullscreenMessage}
        </p>
      ) : null}
    </div>
  );
}
