import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GlassFilter } from "@troules/ui/glass";
import { Telemetry } from "@troules/ui/telemetry";
import { ROOT_DOMAIN } from "@troules/registry";
import { Footer, Header } from "@/components/site-chrome";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(`https://wf-trade-helper.${ROOT_DOMAIN}`),
  title: { default: "WF Trade Helper", template: "%s · WF Trade Helper" },
  description:
    "Which Warframe items sell best right now: plat traded per day, prices and history from warframe.market.",
  openGraph: { type: "website", siteName: "WF Trade Helper", url: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#0b0d12", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
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
