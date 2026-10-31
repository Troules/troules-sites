import Image from "next/image";
import { Glass } from "@troules/ui/glass";
import { sites } from "@troules/registry";
import supernova from "@/assets/supernova.webp";

const IMAGE_CREDIT =
  "NASA, ESA, CSA, STScI, D. Milisavljevic (Purdue University), T. Temim (Princeton University), I. De Looze (University of Gent)";

export default function Home() {
  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 -z-10">
        <Image
          src={supernova}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="object-cover motion-safe:animate-[drift_60s_ease-in-out_infinite_alternate]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgb(5_4_10/0.35)_55%,rgb(5_4_10/0.85)_100%)]" />
      </div>

      <main className="mx-auto flex min-h-dvh max-w-5xl flex-col justify-center gap-10 px-4 py-16 sm:px-8">
        <Glass as="header" className="px-7 py-8 sm:px-10 sm:py-10">
          <p className="font-mono text-xs tracking-[0.3em] text-white/70 uppercase">troules.dynv6.net</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Troules</h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            A small constellation of sites, built and run with an AI crew. Pick a star.
          </p>
        </Glass>

        <section aria-labelledby="sites-heading">
          <h2 id="sites-heading" className="sr-only">
            Sites
          </h2>
          <ul className="grid gap-5 sm:grid-cols-2">
            {sites.map((site) => (
              <li key={site.slug}>
                {site.status === "live" ? (
                  <Glass as="a" href={site.url} interactive className="block h-full p-6 no-underline">
                    <SiteCard name={site.name} url={site.url} description={site.description} />
                  </Glass>
                ) : (
                  <Glass className="h-full p-6 opacity-60" aria-disabled="true">
                    <SiteCard name={site.name} url="coming soon" description={site.description} />
                  </Glass>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-white/60">
        Background: Cassiopeia A supernova remnant (Webb NIRCam). Credit: {IMAGE_CREDIT}. CC BY 4.0.
      </footer>
    </>
  );
}

function SiteCard({ name, url, description }: { name: string; url: string; description: string }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-2xl font-semibold">{name}</h3>
        <span aria-hidden="true" className="text-white/60">
          ↗
        </span>
      </div>
      <p className="mt-1 font-mono text-xs text-white/60">{url.replace(/^https:\/\//, "")}</p>
      <p className="mt-3 text-white/85">{description}</p>
    </>
  );
}
