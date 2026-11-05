"use client";

import { useEffect, useRef, useState } from "react";
import "./preloader.css";
import "./intro.css";

type Phase = "playing" | "finishing" | "splitting" | "done";

const FINISH_MS = 140; // 92 → 100%
const SPLIT_MS = 620; // halves part
const CAP_MS = 3000; // never wait on fonts longer than this

/**
 * The intro (SA-Brand preloader brief): crop marks, the name, a measured line
 * that is a real progress bar (fonts), then the screen splits along it and
 * the hero rises. First visit per tab session only, never with reduced
 * motion, and any click or key skips straight to the split. The gate script
 * decides before first paint (html[data-intro]), so a skipped intro never
 * flashes (the site layout puts it right before this); this component only
 * drives the timeline.
 */
export function Preloader({ date }: { date: string }) {
  const [phase, setPhase] = useState<Phase>("playing");
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    // Skipped (reload, reduced motion): CSS already keeps the overlay hidden.
    if (html.dataset.intro !== "play") return;
    let cancelled = false;
    let split = false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    const doSplit = () => {
      if (split || cancelled) return;
      split = true;
      html.dataset.intro = "split";
      setPhase("splitting");
      later(() => setPhase("done"), SPLIT_MS + 20);
      // The hero's reveal ends by ~840ms after the split; then hand the page back.
      later(() => {
        delete html.dataset.intro;
        delete html.dataset.introFont;
      }, 900);
    };

    // Phase 1 (0 → 92%) is the CSS animation already running since first paint.
    // The split also waits for the name to finish rising (it starts once its font is in).
    const done = (els: Element[]) => Promise.all(els.flatMap((el) => el.getAnimations().map((a) => a.finished.catch(() => undefined))));
    const phase1 = done(lineRef.current ? [lineRef.current] : []);
    const name = done(Array.from(document.querySelectorAll(".sa-pl-nm1, .sa-pl-nm2")));
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const cap = new Promise((r) => later(() => r(undefined), Math.max(0, CAP_MS - performance.now())));
    Promise.all([phase1, Promise.race([Promise.all([fonts, name]), cap])]).then(() => {
      if (split || cancelled) return;
      setPhase("finishing");
      later(doSplit, FINISH_MS);
    });

    const skip = () => doSplit();
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, []);

  return (
    phase !== "done" && (
        <div
          aria-hidden="true"
          className={["sa-intro sa-pl-overlay", phase === "finishing" || phase === "splitting" ? "sa-pl-finishing" : "", phase === "splitting" ? "sa-pl-splitting" : ""].join(" ")}
        >
          <div className="sa-pl-half sa-pl-top">
            <div className="sa-pl-mark sa-pl-markL" />
            <div className="sa-pl-mark sa-pl-markR" />
            <svg className="sa-pl-reg" width="34" height="34" viewBox="0 0 34 34">
              <circle cx="17" cy="17" r="9" fill="none" stroke="#E8B27A" strokeWidth="1" />
              <path d="M0 17H34M17 0V34" stroke="#E8B27A" strokeWidth="1" />
            </svg>
            <div className="sa-pl-caption">
              <span>No. 01 — Portfolio</span>
              <span>{date}</span>
            </div>
            <div className="sa-pl-name">
              <span className="sa-pl-nm1 sa-pl-foil">SHAYAN</span>
              <span className="sa-pl-gap" />
              <span className="sa-pl-nm2 sa-pl-foil">AHMED</span>
            </div>
            <div className="sa-pl-ticks">
              <div className="sa-pl-minor" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }} />
              <div className="sa-pl-major" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }} />
            </div>
            <div className="sa-pl-rider">
              <span className="sa-pl-count" />
            </div>
          </div>
          <div className="sa-pl-half sa-pl-bottom">
            <div className="sa-pl-caption">
              <span>Full-stack developer</span>
              <span className="sa-pl-captionAccent sa-pl-captionMiddle">Websites · Systems · Agents</span>
              <span>Pakistan</span>
            </div>
            <div className="sa-pl-mark sa-pl-markL" />
            <div className="sa-pl-mark sa-pl-markR" />
          </div>
          <div ref={lineRef} className="sa-pl-line" />
        </div>
    )
  );
}
