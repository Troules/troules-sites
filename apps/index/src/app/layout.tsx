import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GlassFilter } from "@troules/ui/glass";
import { Telemetry } from "@troules/ui/telemetry";
import { ROOT_DOMAIN } from "@troules/registry";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(`https://${ROOT_DOMAIN}`),
  title: { default: "Troules", template: "%s · Troules" },
  description: "Troules' corner of the web: a small constellation of sites.",
  openGraph: { type: "website", siteName: "Troules", url: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#05040a", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <GlassFilter />
        {children}
        <Telemetry />
      </body>
    </html>
  );
}
