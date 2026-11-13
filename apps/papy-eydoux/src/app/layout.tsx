import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Work_Sans } from "next/font/google";
import { Telemetry } from "@troules/ui/telemetry";
import { Starfield } from "./starfield";
import "./globals.css";

const display = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-bodoni" });
const text = Work_Sans({ subsets: ["latin"], variable: "--font-work" });

export const metadata: Metadata = {
  metadataBase: new URL("https://papy-eydoux.vercel.app"),
  title: "Papy Eydoux à travers l’Histoire",
  description:
    "De la première lumière de l’Univers à la dernière séance de cinéma : vingt-deux moments où Papy Eydoux était là.",
  openGraph: { type: "website", locale: "fr_FR", url: "/", title: "Papy Eydoux à travers l’Histoire" },
  // A family joke about a real person: shareable by link, kept out of search engines.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${display.variable} ${text.variable}`}>
      <body>
        <Starfield />
        {children}
        <Telemetry />
      </body>
    </html>
  );
}
