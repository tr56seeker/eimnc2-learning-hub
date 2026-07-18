"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type FlashVariant = "success" | "error" | "warning" | "info";

const variantClass: Record<FlashVariant, string> = {
  success: "status-success",
  error: "status-danger",
  warning: "status-warning",
  info: "status-info"
};

const SCROLL_KEY = "eim:scrollBeforeSubmit";

export function FlashMessage({
  message,
  variant = "info",
  className = ""
}: {
  message?: string | null;
  variant?: FlashVariant;
  className?: string;
}) {
  const router = useRouter();
  const lastRefreshed = useRef<string | null>(null);

  useEffect(() => {
    // Any form submit on the page is about to trigger a save-and-redirect —
    // remember where the user was scrolled so it can be restored once we
    // land back here, since the redirect itself always jumps to the top.
    const saveScroll = () => sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    document.addEventListener("submit", saveScroll, true);
    return () => document.removeEventListener("submit", saveScroll, true);
  }, []);

  useEffect(() => {
    // A message here means we just landed on this page from a save/update
    // redirect — force a fresh server fetch so the list reflects the change
    // immediately instead of showing what was cached at the last page load.
    if (message && lastRefreshed.current !== message) {
      lastRefreshed.current = message;
      router.refresh();

      const savedScroll = sessionStorage.getItem(SCROLL_KEY);
      if (savedScroll !== null) {
        sessionStorage.removeItem(SCROLL_KEY);
        window.scrollTo({ top: Number(savedScroll), behavior: "instant" });
      }
    }
  }, [message, router]);

  if (!message) return null;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-2xl border p-4 text-sm font-semibold ${variantClass[variant]} ${className}`}
    >
      {message}
    </div>
  );
}
