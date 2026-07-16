import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EIM NC II Learning Hub | Tabunoc NHS",
  description:
    "Distance learning, exams, submissions, and grading portal for Electrical Installation and Maintenance NC II learners of Tabunoc National High School.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://eimnc2.tabunocnatlhs.com"),
  manifest: "/manifest.webmanifest"
};

const themeInitScript = `
(function () {
  try {
    // sessionStorage (not localStorage) so the choice never outlives this
    // browser session, and no OS/browser dark-mode preference fallback —
    // light is always the default until the user explicitly toggles dark.
    if (sessionStorage.getItem("theme") === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch (_) {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
