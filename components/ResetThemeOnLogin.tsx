"use client";

import { useEffect } from "react";

// Renders on the login page so every path back to sign-in (an explicit sign
// out, or a session that expired) clears any dark-mode choice from the
// previous session. sessionStorage already resets on its own once the
// browser/tab closes — this additionally covers signing out and back in
// again within the same tab, which sessionStorage alone wouldn't catch.
export function ResetThemeOnLogin() {
  useEffect(() => {
    try {
      sessionStorage.removeItem("theme");
    } catch {
      // sessionStorage can throw in locked-down/private-browsing contexts; ignore.
    }
    document.documentElement.classList.remove("dark");
  }, []);

  return null;
}
