"use client";

import { useEffect } from "react";
import { gsap, MQ, SplitText } from "@/lib/gsap";
import { motionGrammar, tokens } from "@/lib/motion";

/**
 * The hero's entrance (motion spec, Phase 4). No markup: it choreographs the
 * server-rendered hero.
 *
 * First visit (the intro plays): under the overlay it sets the start states,
 * and when the screen splits "THE BUILD" rises letter by letter from a mask
 * (40ms apart), the headline rises line by line, one copper sweep crosses
 * "built in.", and the calls to action arrive last.
 * Repeat visits: the hero is already in place (nothing is ever hidden, which
 * keeps LCP early); only the copper sweep plays. Reduced motion: nothing moves.
 */
export function HeroEntrance() {
  useEffect(() => {
    const html = document.documentElement;
    const hero = document.getElementById("hero");
    if (!hero || window.matchMedia(MQ.reduce).matches) return;
    // Looked up when it runs: splitting the headline into lines rebuilds its markup.
    const sweep = () => hero.querySelector<HTMLElement>("[data-hero-sweep]")?.classList.add("is-sweeping");

    if (html.dataset.intro !== "play" && html.dataset.intro !== "split") {
      const t = window.setTimeout(sweep, 450);
      return () => window.clearTimeout(t);
    }

    const t = tokens();
    const mast = hero.querySelector<HTMLElement>("[data-hero-masthead]");
    const letters = mast ? Array.from(mast.querySelectorAll<HTMLElement>("[data-l]")) : [];
    const title = hero.querySelector<HTMLElement>("#hero-title");
    const cta = hero.querySelector<HTMLElement>("[data-hero-cta]");

    // Moving letters lose a shared background-clip:text, so each letter takes
    // its own slice of the foil, measured where it sits (identical at rest).
    const mastFoil = mast?.style.backgroundImage ?? "";
    const slice = () => {
      if (!mast) return;
      const box = mast.getBoundingClientRect();
      const foil = getComputedStyle(mast).backgroundImage;
      for (const l of letters) {
        const r = l.getBoundingClientRect();
        Object.assign(l.style, {
          backgroundImage: foil,
          backgroundSize: `${box.width}px ${box.height}px`,
          backgroundPosition: `${box.left - r.left}px ${box.top - r.top}px`,
          backgroundRepeat: "no-repeat",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        });
      }
      mast.style.backgroundImage = "none";
      mast.style.clipPath = "inset(-30% -4% 0 -4%)";
    };
    const unslice = () => {
      if (!mast) return;
      for (const l of letters) l.removeAttribute("style");
      mast.style.backgroundImage = mastFoil;
      mast.style.removeProperty("clip-path");
    };

    slice();
    const split = title ? SplitText.create(title, { type: "lines", mask: "lines" }) : null;
    gsap.set(letters, { yPercent: 105 });
    if (split) gsap.set(split.lines, { yPercent: 105 });
    if (cta) gsap.set(cta, { opacity: 0, y: t.travel });

    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      const lines = split?.lines ?? [];
      // The headline's lines are done rising here: hand back the plain h1, then sweep "built in.".
      const linesDone = 0.25 + t.reveal + 0.08 * Math.max(0, lines.length - 1);
      gsap
        .timeline({
          onComplete: () => {
            unslice();
            if (cta) gsap.set(cta, { clearProps: "opacity,transform" });
          },
        })
        .to(letters, { yPercent: 0, duration: t.hero * 0.8, ease: motionGrammar.ease, stagger: 0.04 }, 0.05)
        .to(lines, { yPercent: 0, duration: t.reveal, ease: motionGrammar.ease, stagger: 0.08 }, 0.25)
        .call(
          () => {
            split?.revert();
            sweep();
          },
          [],
          linesDone,
        )
        .to(cta ?? [], { opacity: 1, y: 0, duration: t.reveal, ease: motionGrammar.ease }, 0.75);
    };

    if (html.dataset.intro === "split") play();
    const mo = new MutationObserver(() => {
      if (html.dataset.intro !== "play") play();
    });
    mo.observe(html, { attributes: true, attributeFilter: ["data-intro"] });
    // Same failsafe as the overlay's CSS: never hold the hero back past ~4s.
    const failsafe = window.setTimeout(play, 4100);
    return () => {
      mo.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return null;
}
