import Link from "next/link";

export type MiniListItem = {
  id: string;
  primary: string;
  secondary: string;
  href: string;
};

export function MiniListCard({
  title,
  items,
  emptyMessage
}: {
  title: string;
  items: MiniListItem[];
  emptyMessage: string;
}) {
  return (
    <div className="card rounded-[1.5rem] p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{title}</h2>
      {!items.length ? (
        <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      ) : (
        <div className="mt-4 grid gap-1">
          {items.map((item) => (
            <Link key={item.id} href={item.href} className="block rounded-xl px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.97]">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.primary}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.secondary}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
