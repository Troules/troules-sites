/**
 * Black sky with small white stars, rendered once on the server as an inline SVG (no image request, no JS).
 * Positions come from a seeded PRNG so every build draws the same sky. Percent coordinates make the field
 * stretch to any viewport while radii stay in pixels, so stars stay round.
 */
const STARS = 280;

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(1949);
const stars = Array.from({ length: STARS }, (_, i) => {
  const size = rand();
  return {
    id: i,
    x: (rand() * 100).toFixed(2),
    y: (rand() * 100).toFixed(2),
    // Mostly pinpricks, a few brighter stars.
    r: size > 0.97 ? 1.4 : size > 0.85 ? 1 : 0.6,
    opacity: (0.35 + rand() * 0.65).toFixed(2),
    twinkle: rand() > 0.88,
    delay: (rand() * 6).toFixed(2),
  };
});

export function Starfield() {
  return (
    <svg aria-hidden="true" className="starfield" width="100%" height="100%">
      {stars.map((s) => (
        <circle
          key={s.id}
          cx={`${s.x}%`}
          cy={`${s.y}%`}
          r={s.r}
          fill="#fff"
          opacity={s.opacity}
          className={s.twinkle ? "twinkle" : undefined}
          style={s.twinkle ? { animationDelay: `${s.delay}s` } : undefined}
        />
      ))}
    </svg>
  );
}
