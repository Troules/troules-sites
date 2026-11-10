"use client";

import { useSyncExternalStore } from "react";

const never = () => () => {};
const two = (n: number) => String(n).padStart(2, "0");

/**
 * A UTC hour window in the reader's own time zone ("18:00–00:00 your time"). The page is static, so the server
 * renders nothing here and the browser fills it in; readers already on UTC see nothing extra.
 */
export function LocalHours({ from, to }: { from: number; to: number }) {
  const offset = useSyncExternalStore<number | null>(
    never,
    () => -new Date().getTimezoneOffset(),
    () => null,
  );
  if (!offset) return null;
  const local = (hour: number) => {
    const m = (((hour * 60 + offset) % 1440) + 1440) % 1440;
    return `${two(Math.floor(m / 60))}:${two(m % 60)}`;
  };
  return (
    <span className="block">
      {local(from)}–{local(to)} your time
    </span>
  );
}
