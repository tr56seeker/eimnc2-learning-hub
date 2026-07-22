import Image from "next/image";
import Link from "next/link";

// Matches the structure/style of the school's official site (tabunocnatlhs.com)
// so this Hub reads as part of the same institution, not a disconnected tool.
// Kept dark/branded regardless of the page's own light/dark toggle, same as
// the reference site's footer.
const SCHOOL_SITE = "https://tabunocnatlhs.com";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Faculty & Staff", href: SCHOOL_SITE },
      { label: "Learner Population", href: SCHOOL_SITE },
      { label: "Evacuation Map", href: SCHOOL_SITE }
    ]
  },
  {
    title: "Services",
    links: [
      { label: "Enrollment Guide", href: SCHOOL_SITE },
      { label: "SHS Offerings", href: SCHOOL_SITE },
      { label: "School MIS", href: SCHOOL_SITE },
      { label: "Install App", href: "/" }
    ]
  },
  {
    title: "Updates",
    links: [
      { label: "School Calendar", href: SCHOOL_SITE },
      { label: "School Memos", href: SCHOOL_SITE },
      { label: "Frequently Asked Questions", href: SCHOOL_SITE }
    ]
  },
  {
    title: "Official Channels",
    links: [
      { label: "Facebook Page", href: SCHOOL_SITE },
      { label: "Messenger", href: SCHOOL_SITE },
      { label: "Email the School", href: SCHOOL_SITE },
      { label: "Website", href: SCHOOL_SITE }
    ]
  }
];

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="h-2 bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600" />

      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-4">
              <Image src="/images/deped-logo.png" alt="Department of Education" width={140} height={64} className="h-11 w-auto object-contain" />
              <span aria-hidden="true" className="h-9 w-px bg-slate-700" />
              <Image src="/images/tabunoc-nhs-seal.png" alt="Tabunoc National High School Seal" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
            </div>
            <p className="mt-4 text-lg font-semibold text-white">Tabunoc National High School</p>
            <p className="mt-2 text-sm font-semibold text-amber-400">School ID: 303111</p>
            <p className="text-sm text-slate-400">Division of Talisay City, Cebu</p>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
              A public secondary school serving Junior High School and Senior High School learners in Tabunok, Talisay City, Cebu.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{column.title}</p>
              <ul className="mt-4 grid gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm font-semibold text-slate-300 hover:text-teal-300 active:scale-[0.97]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-800 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Tabunoc National High School. All rights reserved.
            <br />
            School ID: 303111
          </p>
          <p className="sm:text-right">Information posted on this website is for public information and may be updated based on official DepEd and school issuances.</p>
        </div>
      </div>
    </footer>
  );
}
