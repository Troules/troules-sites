import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import { Telemetry } from "@troules/ui/telemetry";
import { SITE } from "@/lib/site";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif-body", style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
  openGraph: { type: "website", siteName: SITE.name },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0d12" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body className="font-sans antialiased">
        <a
          href="#content"
          className="focus:bg-paper sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:rounded focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <header className="mx-auto flex max-w-3xl items-center justify-between px-5 pt-8 pb-4 text-sm">
          <Link href="/" className="font-semibold tracking-tight">
            Troules <span className="text-muted">/ blog</span>
          </Link>
          <nav className="text-muted flex gap-5">
            <Link href="/tags" className="hover:text-ink">
              Tags
            </Link>
            <a href="/feed.xml" className="hover:text-ink">
              RSS
            </a>
            <a href={SITE.home} className="hover:text-ink">
              Index ↗
            </a>
          </nav>
        </header>
        <main id="content" className="mx-auto max-w-3xl px-5 pb-24">
          {children}
        </main>
        <footer className="border-rule text-muted mx-auto max-w-3xl border-t px-5 py-8 text-xs">
          Written with Hermes, reviewed by a human, published from Telegram.
        </footer>
        <Telemetry />
      </body>
    </html>
  );
}
