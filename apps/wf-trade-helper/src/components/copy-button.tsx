"use client";

import { useState } from "react";

export function CopyButton({ text, label }: { text: string; label: string }) {
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
          // Clipboard blocked (permissions, insecure context): the price stays visible to copy by hand.
        }
      }}
      className="border-line-strong bg-chip text-ink min-h-11 flex-[1_1_120px] cursor-pointer rounded-[10px] border px-3 text-sm font-medium"
    >
      <span aria-live="polite">{copied ? `Copied ${text}` : label}</span>
    </button>
  );
}
