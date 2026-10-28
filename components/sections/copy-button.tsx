"use client";

import { useState } from "react";

/** Copies text; falls back to selecting it when the clipboard is blocked. */
export function CopyButton({ value, targetId }: { value: string; targetId: string }) {
  const [label, setLabel] = useState("Copy");

  const flash = (text: string) => {
    setLabel(text);
    window.setTimeout(() => setLabel("Copy"), 1600);
  };

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      flash("Copied");
    } catch {
      const el = document.getElementById(targetId);
      if (!el) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      flash("Selected");
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Copy ${value}`}
      className="ink-inset min-h-9 cursor-pointer rounded-lg bg-ink-2 px-3 font-mono text-[10.5px] tracking-[0.1em] text-muted-ink transition-colors hover:text-paper"
    >
      <span aria-live="polite">{label}</span>
    </button>
  );
}
