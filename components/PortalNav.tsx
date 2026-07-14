"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PortalNav({ links }: { links: string[][] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex snap-x gap-1.5 overflow-x-auto rounded-full border border-slate-200/70 bg-slate-50/70 p-1 shadow-inner shadow-slate-200/40 [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]"
    >
      {links.map(([label, href]) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "focus-ring snap-start whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold",
              isActive
                ? "bg-white text-teal-800 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
            ].join(" ")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
