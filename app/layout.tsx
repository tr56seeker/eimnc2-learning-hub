import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EIM NC II Learning Hub | Tabunoc NHS",
  description:
    "Distance learning, exams, submissions, and grading portal for Electrical Installation and Maintenance NC II learners of Tabunoc National High School.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://eimnc2.tabunocnatlhs.com"),
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
