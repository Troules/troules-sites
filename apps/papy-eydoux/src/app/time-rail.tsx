"use client";

import { useEffect, useState } from "react";

type Stop = { slug: string; short: string; date: string };

/**
 * The time scale on the side of the screen. Plain anchor links (works without JS); JS only marks the moment
 * currently on screen.
 */
export function TimeRail({ stops }: { stops: Stop[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-moment]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      // A slide counts as current once it covers the middle of the viewport.
      { rootMargin: "-50% 0px -50% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    // The hero and the ending are not on the rail: clear the mark when they take the screen.
    const outside = document.querySelectorAll<HTMLElement>("[data-off-rail]");
    const offObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setActive(null);
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    outside.forEach((s) => offObserver.observe(s));
    return () => {
      observer.disconnect();
      offObserver.disconnect();
    };
  }, []);

  return (
    <nav aria-label="Frise chronologique" className="rail">
      <ol>
        {stops.map((stop) => {
          const current = stop.slug === active;
          return (
            <li key={stop.slug}>
              <a href={`#${stop.slug}`} aria-current={current ? "step" : undefined} title={stop.date}>
                <span className="rail-tick" aria-hidden="true" />
                <span className="rail-label">{stop.short}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
