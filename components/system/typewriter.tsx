"use client";

import { useEffect, useRef, useState } from "react";
import { MQ } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * Typewriter: text types out with a human rhythm (uneven keystrokes, longer
 * pauses after punctuation and between words) behind a copper caret.
 *
 * Starts when it scrolls into view, or whenever `trigger` changes (> 0).
 * The full text is in the HTML from the first render (screen readers and
 * search engines read it), an invisible copy reserves its final size so
 * nothing reflows, and reduced motion shows it at once.
 */
export type TypewriterProps = {
  text: string;
  /** Average ms per character. */
  speed?: number;
  /** ms before typing starts. */
  delay?: number;
  /** "view" (default) types once on entering the viewport; a number re-types each time it changes. */
  trigger?: "view" | number;
  /** "typing": caret only while typing; "blink": keeps blinking after; false: none. */
  caret?: "typing" | "blink" | false;
  as?: "span" | "div" | "p" | "dd";
  className?: string;
};

/** Deterministic jitter per character, so the rhythm is natural but stable. */
function keystroke(text: string, i: number, speed: number) {
  const prev = text[i - 1] ?? "";
  const jitter = 0.55 + (((i * 9301 + 49297) % 233280) / 233280) * 0.9;
  let ms = speed * jitter;
  if (/[.!?]/.test(prev)) ms += speed * 9;
  else if (/[,;:—·›]/.test(prev)) ms += speed * 5;
  else if (prev === " ") ms += speed * 0.6;
  return ms;
}

export function Typewriter({
  text,
  speed = 28,
  delay = 0,
  trigger = "view",
  caret = "typing",
  as: Tag = "span",
  className,
}: TypewriterProps) {
  const root = useRef<HTMLElement>(null);
  const [shown, setShown] = useState<number | null>(null);
  const [run, setRun] = useState(0);

  // In-view start (once).
  useEffect(() => {
    if (trigger !== "view") return;
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRun(1);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [trigger]);

  const key = trigger === "view" ? run : trigger;

  useEffect(() => {
    if (!key || window.matchMedia(MQ.reduce).matches) return;
    let n = 0;
    let timer = 0;
    const step = () => {
      n += 1;
      setShown(n >= text.length ? null : n);
      if (n < text.length) timer = window.setTimeout(step, keystroke(text, n, speed));
    };
    // Blank first, then type after the delay.
    timer = window.setTimeout(() => {
      setShown(0);
      timer = window.setTimeout(step, delay);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key, text, speed, delay]);

  const typing = shown !== null;
  const showCaret = caret === "blink" || (caret === "typing" && typing);

  return (
    <Tag ref={root as React.Ref<never>} className={cn(Tag === "span" ? "inline-grid" : "grid", className)}>
      <span className="sr-only">{text}</span>
      {/* Reserves the final size via CSS generated text, so the words exist
          once for readers (above) and once on screen, never a third time. */}
      <span aria-hidden="true" data-text={text} className="invisible [grid-area:1/1] before:content-[attr(data-text)]" />
      <span aria-hidden="true" className="[grid-area:1/1]">
        {typing ? text.slice(0, shown) : text}
        {showCaret && (
          <span
            className={cn(
              "ml-px inline-block h-[1em] w-[0.5em] translate-y-[0.15em] bg-copper/80",
              !typing && "animate-[caret-blink_1.05s_steps(1)_infinite]",
            )}
          />
        )}
      </span>
    </Tag>
  );
}
