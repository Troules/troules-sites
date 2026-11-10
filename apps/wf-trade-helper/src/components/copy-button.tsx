"use client";

import { useState } from "react";

/** Copies `text`; the button itself confirms ("Copied 109") for two seconds, read out to screen readers. */
export function CopyButton({
  text,
  label,
  copied: copiedLabel,
  className = "btn flex-[1_1_120px]",
}: {
  text: string;
  label: string;
  /** What the button says after copying; defaults to "Copied <text>". */
  copied?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked (permissions, insecure context): the text stays visible to copy by hand.
        }
      }}
      className={className}
    >
      <span aria-live="polite">{copied ? (copiedLabel ?? `Copied ${text}`) : label}</span>
    </button>
  );
}
