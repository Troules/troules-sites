import { initials } from "@/lib/format";
import { ASSET_BASE } from "@/lib/types";

/**
 * Item thumbnail straight from the warframe.market CDN. A plain <img>, not next/image: the thumbs are already
 * small, and every next/image resize would count against the Vercel Hobby quota of 5k transformations/month.
 */
export function ItemIcon({ name, thumb, size = 32 }: { name: string; thumb: string | null; size?: number }) {
  const box = { width: size, height: size };
  if (!thumb)
    return (
      <span
        aria-hidden="true"
        style={box}
        className="border-line-strong bg-raised text-muted grid flex-none place-items-center rounded-lg border text-[11px]"
      >
        {initials(name)}
      </span>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element -- see the comment above
    <img
      src={`${ASSET_BASE}${thumb}`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={box}
      className="border-line-strong bg-raised flex-none rounded-lg border object-contain"
    />
  );
}
