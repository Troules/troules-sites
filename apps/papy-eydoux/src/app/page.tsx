import Image from "next/image";
import { agoLabel } from "@/lib/ago";
import { REFERENCE_YEAR, timeline } from "@/lib/timeline";
import { TimeRail } from "./time-rail";

export default function Home() {
  return (
    <>
      <TimeRail stops={timeline.map(({ slug, short, date }) => ({ slug, short, date }))} />

      <main>
        <header id="debut" data-off-rail className="slide hero">
          <div className="hero-inner">
            <h1>Papy Eydoux à travers l’Histoire</h1>
            <p className="lead">
              De la première lumière de l’Univers à la dernière séance de cinéma : vingt-deux moments où il était là, et
              où personne ne l’avait remarqué.
            </p>
          </div>
          <a href={`#${timeline[0]!.slug}`} className="scroll-hint">
            Faites défiler pour avancer dans le temps
            <svg aria-hidden="true" width="14" height="40" viewBox="0 0 14 40">
              <path d="M7 0v38M1 32l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </a>
        </header>

        {timeline.map((moment, i) => (
          <article
            key={moment.slug}
            id={moment.slug}
            data-moment
            className="slide moment"
            aria-labelledby={`${moment.slug}-titre`}
          >
            <figure className="frame">
              <Image
                src={moment.image}
                alt={moment.alt}
                placeholder="blur"
                unoptimized
                loading={i === 0 ? "eager" : "lazy"}
              />
            </figure>
            <div className="cartel">
              <p className="date">
                <time>{moment.date}</time>
              </p>
              {moment.year < REFERENCE_YEAR && (
                <p className="ago">{agoLabel(moment.year, REFERENCE_YEAR, moment.approximate)}</p>
              )}
              <h2 id={`${moment.slug}-titre`}>{moment.title}</h2>
              <p className="place">{moment.place}</p>
              <p className="description">{moment.description}</p>
              <p className="position">
                {i + 1} sur {timeline.length}
              </p>
            </div>
          </article>
        ))}

        <footer data-off-rail className="slide ending">
          <div>
            <h2>Fin de la bobine</h2>
            <p>Montages réalisés avec affection pour Papy Eydoux.</p>
            <p>Toute ressemblance avec des événements historiques est entièrement volontaire.</p>
            <a href="#debut">Revenir au Big Bang</a>
          </div>
        </footer>
      </main>
    </>
  );
}
