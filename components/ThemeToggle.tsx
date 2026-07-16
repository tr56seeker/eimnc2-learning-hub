"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Reads the class the anti-FOUC inline script (app/layout.tsx) already set
    // on <html> before hydration — not a value derivable during render itself.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200/80 bg-white text-slate-600 shadow-sm hover:border-teal-200 hover:text-teal-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-700 dark:hover:text-teal-300"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
          <path d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 1 1-2 0V5.5a1 1 0 0 1 1-1Zm0 11.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7.5-4a1 1 0 0 1-1 1H17a1 1 0 1 1 0-2h1.5a1 1 0 0 1 1 1ZM7 12a1 1 0 0 1-1 1H4.5a1 1 0 1 1 0-2H6a1 1 0 0 1 1 1Zm10.03-5.03a1 1 0 0 1 0 1.42l-1.06 1.06a1 1 0 1 1-1.42-1.42l1.06-1.06a1 1 0 0 1 1.42 0ZM9.45 15.6a1 1 0 0 1 0 1.42l-1.06 1.06a1 1 0 1 1-1.42-1.42l1.06-1.06a1 1 0 0 1 1.42 0ZM12 17.5a1 1 0 0 1 1 1V20a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1Zm5.6-1.9a1 1 0 0 1 1.42 0l1.06 1.06a1 1 0 1 1-1.42 1.42l-1.06-1.06a1 1 0 0 1 0-1.42ZM6.98 6.98a1 1 0 0 1 1.42 0L9.45 8.03a1 1 0 1 1-1.41 1.42L6.98 8.39a1 1 0 0 1 0-1.41Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
          <path d="M20.35 14.5a8.5 8.5 0 0 1-11-11 .75.75 0 0 0-.94-.94A10 10 0 1 0 21.3 15.44a.75.75 0 0 0-.95-.94Z" />
        </svg>
      )}
    </button>
  );
}
