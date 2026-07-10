"use client";

import { useEffect } from "react";

export function PresenceHeartbeat() {
  useEffect(() => {
    const sendHeartbeat = () => {
      void fetch("/api/presence/heartbeat", { method: "POST", cache: "no-store" }).catch(() => undefined);
    };

    sendHeartbeat();
    const interval = window.setInterval(sendHeartbeat, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return null;
}
