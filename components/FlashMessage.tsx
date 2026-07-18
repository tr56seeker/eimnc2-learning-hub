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
    // A message here means we just landed on this page from a save/update
    // redirect — force a fresh server fetch so the list reflects the change
    // immediately instead of showing what was cached at the last page load.
    if (message && lastRefreshed.current !== message) {
      lastRefreshed.current = message;
      router.refresh();
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
