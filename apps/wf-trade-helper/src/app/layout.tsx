import type { Metadata, Viewport } from "next";
import { Saira } from "next/font/google";
import { GlassFilter } from "@troules/ui/glass";
import { Telemetry } from "@troules/ui/telemetry";
import { ROOT_DOMAIN } from "@troules/registry";
import { Footer, Header } from "@/components/site-chrome";
import "./globals.css";

// One variable file with a width axis: regular width for text, condensed for headings and numbers (globals.css).
const saira = Saira({ subsets: ["latin"], axes: ["wdth"], variable: "--font-saira" });

export const metadata: Metadata = {
  metadataBase: new URL(`https://wf-trade-helper.${ROOT_DOMAIN}`),
  title: { default: "WF Trade Helper", template: "%s · WF Trade Helper" },
  description:
    "What sells in Warframe right now and for how much: prices and history from warframe.market, your own stash valued, sets against their parts, and ducats per plat for Baro.",
  openGraph: { type: "website", siteName: "WF Trade Helper", url: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#07090f", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={saira.variable}>
      <body className="font-sans text-sm antialiased">
        <GlassFilter />
        <Header />
        {children}
        <Footer />
        <Telemetry />
      </body>
    </html>
  );
}
