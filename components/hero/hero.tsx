"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ImageRef, SiteSettings } from "@/lib/content/types";
import { Button, Label, type ScreenHandle } from "@/components/system";
import { useFinePointer, useReducedMotion } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { HeroSlab } from "./hero-slab";
import { useOpsDemo } from "./use-ops-demo";

type HeroProps = {
  settings: SiteSettings;
  /** Real Brands Attire storefront screenshot, when available. */
  storefront?: ImageRef;
  /** Case study the secondary call to action opens. */
  caseStudyHref?: string;
};

const lines = ["Websites with", "the systems", "built in"] as const;
const trust = ["Clients in Pakistan and abroad", "Calls in your time zone", "Reply within 24h"];
const TILT = { x: 3, y: -7 };

/**
 * Hero (revised): magazine-cover headline plus an interactive proof. The slab
 * is a working demo of what Shayan builds: agents prepare decisions, the
 * visitor approves them. No scroll-jacking; the headline paints immediately.
 */
export function Hero({ settings, storefront, caseStudyHref }: HeroProps) {
  const root = useRef<HTMLElement>(null);
  const screen = useRef<ScreenHandle>(null);
  const reduce = useReducedMotion();
  const fine = useFinePointer();

  // The demo runs after the screen boots and only while the hero is on screen.
  const [booted, setBooted] = useState(false);
  const [inView, setInView] = useState(true);
  const { state, decision, decide } = useOpsDemo(settings.heroDemo, booted && inView);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Screen boot after the CSS entrance has placed the slab.
  useEffect(() => {
    const id = window.setTimeout(
      () => {
        screen.current?.boot();
        setBooted(true);
      },
      reduce ? 0 : 750,
    );
    return () => window.clearTimeout(id);
  }, [reduce]);

  // Slight turn toward the cursor (desktop). Motion owns the slab's rotation.
  const rx = useSpring(useMotionValue(TILT.x), { stiffness: 50, damping: 18 });
  const ry = useSpring(useMotionValue(TILT.y), { stiffness: 50, damping: 18 });
  useEffect(() => {
    if (!fine || reduce) return;
    const onMove = (e: PointerEvent) => {
      rx.set(TILT.x - (e.clientY / window.innerHeight - 0.5) * 4);
      ry.set(TILT.y + (e.clientX / window.innerWidth - 0.5) * 7);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [fine, reduce, rx, ry]);

  return (
    <section
      ref={root}
      id="hero"
      aria-labelledby="hero-title"
      className="hero-surface relative overflow-clip pb-16 pt-[calc(env(safe-area-inset-top)+104px)] min-[900px]:pb-20 min-[900px]:pt-[calc(env(safe-area-inset-top)+112px)]"
    >
      <div className="wrap [--hl:clamp(38px,10.4vw,64px)] min-[900px]:[--hl:min(8vw,13vh,132px)]">
        <Label className="hero-in mb-5 block [animation-delay:.05s]">Full-stack developer · Pakistan</Label>

        <h1
          id="hero-title"
          aria-label="Websites with the systems built in."
          className="whitespace-nowrap font-display text-[length:var(--hl)] font-extrabold uppercase leading-[0.86] tracking-[-0.045em] [font-variation-settings:'wdth'_108]"
        >
          {lines.map((l, i) => (
            <span key={l} aria-hidden="true" className="block overflow-hidden pb-[0.04em]">
              <span className="hero-line inline-block" style={{ animationDelay: `${0.06 + i * 0.07}s` }}>
                {i === 2 ? (
                  <>
                    <em className="font-[750] italic text-walnut [font-variation-settings:'wdth'_92]">{l}</em>
                    <i className="ml-[0.05em] inline-block size-[0.15em] rounded-full bg-copper shadow-[0_0_0.22em_rgb(201_133_63/.8)]" />
                  </>
                ) : (
                  l
                )}
              </span>
            </span>
          ))}
        </h1>

        {/* Below the headline: copy on the left, the demo on the right rising beside "BUILT IN." */}
        <div className="mt-8 grid grid-cols-1 gap-10 min-[1000px]:mt-0 min-[1000px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] min-[1000px]:items-start min-[1000px]:gap-14">
          <div className="flex flex-col gap-7 min-[1000px]:pt-9">
            <p className="hero-in max-w-[30em] text-[17px] leading-[1.6] text-muted [animation-delay:.3s] min-[900px]:text-lg">
              I&apos;m <strong className="font-semibold text-ink">Shayan Ahmed</strong>. I build the storefront your
              customers use and the back office that runs it, with agents that take the routine work off your plate
              while you approve every decision.
            </p>
            <div className="hero-in flex flex-wrap gap-3 [animation-delay:.38s] max-[520px]:[&>*]:flex-1">
              <Button href="#contact" arrow size="lg" className="w-full">
                Start a project
              </Button>
              {caseStudyHref && (
                <Button href={caseStudyHref} variant="paper" size="lg" className="w-full">
                  See a case study
                </Button>
              )}
            </div>
            <p
              aria-live="polite"
              className="hero-in hidden items-center gap-3 font-mono text-xs uppercase tracking-[0.1em] text-walnut [animation-delay:.46s] min-[1000px]:flex"
            >
              <span aria-hidden="true" className="inline-block h-px w-10 bg-walnut/60" />
              {state.touched ? "Agents do the routine. You make the calls." : "Try it: make the call on the right."}
            </p>
            <ul className="hero-in hidden flex-wrap gap-x-6 gap-y-2 text-sm text-muted [animation-delay:.52s] min-[1000px]:flex">
              {trust.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-1 rounded-full bg-walnut" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="hero-slab-in relative min-[1000px]:-mt-[calc(var(--hl)*0.98)] min-[1000px]:justify-self-end">
            <motion.div
              style={{ rotateX: rx, rotateY: ry, transformPerspective: 1600 }}
              className={cn("w-full min-[1000px]:w-[min(44vw,560px)]", !fine && "transform-none!")}
            >
              <HeroSlab
                state={state}
                decision={decision}
                onDecide={decide}
                source={settings.heroDemo.source}
                storefront={storefront}
                screenRef={screen}
              />
            </motion.div>
            <div
              aria-hidden="true"
              className="mx-auto -mt-3 h-7 w-[84%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(17_17_17/.22),transparent)] blur-md"
            />
          </div>

          {/* Trust facts on small screens sit under the demo. */}
          <ul className="flex flex-col gap-2 text-sm text-muted min-[1000px]:hidden">
            {trust.map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span aria-hidden="true" className="size-1 rounded-full bg-walnut" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
