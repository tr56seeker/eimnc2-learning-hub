"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type NavLink = { label: string; href: string };
export type NavItem = NavLink | { label: string; items: NavLink[] };

function isGroup(item: NavItem): item is { label: string; items: NavLink[] } {
  return "items" in item;
}

const activeClass = "bg-white text-teal-800 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-amber-300 dark:ring-slate-700/80";
const inactiveClass = "text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100";

export function PortalNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!openGroup) return;

    function handleOutsideClick(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenGroup(null);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openGroup]);

  function isLinkActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      ref={navRef}
      aria-label="Primary"
      className="relative flex flex-wrap items-center gap-1.5 rounded-full border border-slate-200/70 bg-slate-50/70 p-1 shadow-inner shadow-slate-200/40 dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-black/20"
    >
      {items.map((item) => {
        if (!isGroup(item)) {
          const active = isLinkActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`focus-ring whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold ${active ? activeClass : inactiveClass}`}
            >
              {item.label}
            </Link>
          );
        }

        const groupActive = item.items.some((link) => isLinkActive(link.href));
        const isOpen = openGroup === item.label;

        return (
          <div key={item.label} className="relative">
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={isOpen}
              onClick={() => setOpenGroup(isOpen ? null : item.label)}
              className={`focus-ring inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold ${groupActive ? activeClass : inactiveClass}`}
            >
              {item.label}
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" clipRule="evenodd" />
              </svg>
            </button>

            {isOpen ? (
              <div role="menu" className="absolute left-0 top-[calc(100%+0.5rem)] z-40 min-w-48 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xl shadow-slate-950/10 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-black/40">
                {item.items.map((link) => {
                  const active = isLinkActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-xl px-3.5 py-2.5 text-sm font-semibold ${active ? "bg-teal-50 text-teal-800 dark:bg-amber-950/50 dark:text-amber-300" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"}`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
