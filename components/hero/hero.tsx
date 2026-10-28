"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ImageRef, SiteSettings } from "@/lib/content/types";
import { useSmoothScroll } from "@/components/providers/smooth-scroll";
import { Button, Keycap, Label, StatusLight, type ScreenHandle } from "@/components/system";
import { useFinePointer, useReducedMotion } from "@/hooks/use-media-query";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { motionGrammar } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { HeroSlab } from "./hero-slab";
import { createHeroState, hasWebGL, type HeroState } from "./three/shared";
import { useHeroConsole } from "./use-hero-console";

// The 3D chunk loads only on capable desktops, after the page is interactive.
const HeroScene = dynamic(() => import("./three/hero-scene"), { ssr: false });

const layerCards = [
  { label: "Layer 1 · Glass", title: "Website", text: "Storefront, pages and checkout your customers use." },
  { label: "Layer 2 · Board", title: "System", text: "Dashboards, orders, leads and records your team runs on." },
  { label: "Layer 3 · Core", title: "Automation", text: "Agents flag orders, send reminders and prepare restocks. You approve." },
];

type HeroProps = {
  settings: SiteSettings;
  /** Real Brands Attire storefront screenshot, when available. */
  storefront?: ImageRef;
};

const lines = ["Websites with", "the systems", "built in"] as const;
const BASE_TILT = { x: 5, y: -14 };

/**
 * Hero (DESIGN.md §8). Magazine-cover layout: full-width headline behind the
 * display slab. The HTML slab is the base (phones, reduced motion, no WebGL,
 * keyboard and screen readers); on capable desktops the 3D slab crossfades
 * over it and the hero pins for the teardown and dive.
 */
export function Hero({ settings, storefront }: HeroProps) {
  const root = useRef<HTMLElement>(null);
  const strip = useRef<ScreenHandle>(null);
  const led = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const { scrollTo } = useSmoothScroll();

  // Console runs after the screen boots, and only while the hero is on screen.
  const [booted, setBooted] = useState(false);
  const [inView, setInView] = useState(true);
  const live = useHeroConsole(settings.heroCaptionEvents, booted && inView, reduce);
  const latest = live.lines[live.lines.length - 1];

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pointer tilt (desktop): Motion owns the slab's rotation.
  const rx = useSpring(useMotionValue(BASE_TILT.x), { stiffness: 60, damping: 18 });
  const ry = useSpring(useMotionValue(BASE_TILT.y), { stiffness: 60, damping: 18 });
  useEffect(() => {
    if (!fine || reduce) return;
    const onMove = (e: PointerEvent) => {
      const px = e.clientX / window.innerWidth - 0.5;
      const py = e.clientY / window.innerHeight - 0.5;
      rx.set(BASE_TILT.x - py * 6);
      ry.set(BASE_TILT.y + px * 10);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [fine, reduce, rx, ry]);

  // 3D mode: desktop, motion allowed, WebGL available. Decided after mount.
  const [three, setThree] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  // Mutable bridge between React/GSAP and the 3D render loop.
  const heroState = useRef<HeroState>(createHeroState());
  useEffect(() => {
    heroState.current.live = { lines: live.lines, channels: live.channels, mode: live.mode, clock: live.clock };
    heroState.current.onToggle = live.toggle;
  }, [live.lines, live.channels, live.mode, live.clock, live.toggle]);

  // Entrance (~1.4s). GSAP owns the anchor, lines, foot and the 3D boot values; never the tilt layer.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.reduce, () => setBooted(true));
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root);
        const boot = heroState.current.boot;
        Object.assign(boot, { rise: 0, led: 0, screen: 0.03 });
        const tl = gsap.timeline();
        tl.from(q("[data-hero-line]"), { yPercent: 115, duration: 1.05, stagger: 0.08, ease: "expo.out" }, 0.15)
          .from(q("[data-hero-kicker]"), { y: 16, duration: 0.8, ease: "expo.out" }, 0.1)
          .from(q("[data-hero-anchor]"), { y: 70, opacity: 0, duration: 1.6, ease: "expo.out" }, 0.3)
          .to(boot, { rise: 1, duration: 1.6, ease: "expo.out" }, 0.3)
          // status light blinks twice
          .fromTo(led.current, { opacity: 0.05 }, { opacity: 1, duration: 0.05 }, 0.5)
          .to(led.current, { opacity: 0.05, duration: 0.07 }, 0.58)
          .to(led.current, { opacity: 1, duration: 0.05 }, 0.68)
          .to(boot, { led: 1, duration: 0.05 }, 0.5)
          .to(boot, { led: 0.04, duration: 0.07 }, 0.58)
          .to(boot, { led: 1, duration: 0.05 }, 0.68)
          // screen boots with the shared flicker
          .add(() => strip.current?.boot(), 0.8)
          .to(boot, { screen: 0.6, duration: 0.04 }, 0.8)
          .to(boot, { screen: 0.06, duration: 0.05 }, 0.86)
          .to(boot, { screen: 0.85, duration: 0.04 }, 0.93)
          .to(boot, { screen: 0.25, duration: 0.04 }, 0.99)
          .to(boot, { screen: 1, duration: 0.35, ease: "power2.out" }, 1.04)
          .add(() => setBooted(true), 1.05)
          .from(q("[data-rise-in]"), { y: 26, duration: 0.85, stagger: 0.07, ease: "expo.out" }, 0.9);
        return () => Object.assign(boot, { rise: 1, led: 1, screen: 1 });
      });
      mm.add(MQ.desktop, () => {
        if (hasWebGL()) setThree(true);
        return () => {
          setThree(false);
          setSceneReady(false);
        };
      });
    },
    { scope: root },
  );

  // Scroll. 3D: the hero pins for 1.6 screens: headline splits off, slab tears down
  // into three labelled layers, rejoins and the camera dives into the live strip.
  // 2D desktop: headline lines split off, bottom row sinks.
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const dirs = [-1, 1, -1];
      gsap.matchMedia().add(MQ.desktop, () => {
        if (!three) {
          const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.8 };
          q("[data-hero-row]").forEach((row, i) => gsap.to(row, { xPercent: dirs[i] * 45, ease: "none", scrollTrigger: st }));
          gsap.to(q("[data-hero-foot]"), { y: 60, opacity: 0, ease: "none", scrollTrigger: { ...st, end: "40% top" } });
          gsap.to(q("[data-hero-anchor]"), { yPercent: -12, ease: "none", scrollTrigger: st });
          return;
        }
        heroState.current.p = 0;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: `+=${motionGrammar.maxPin * 100}%`,
            pin: true,
            scrub: motionGrammar.scrub,
            anticipatePin: 1,
          },
        });
        tl.to(heroState.current, { p: 1, duration: 1 }, 0)
          .to(q("[data-hero-kicker]"), { opacity: 0, duration: 0.08 }, 0)
          .to(q("[data-hero-caption]"), { opacity: 0, duration: 0.12 }, 0)
          .to(q("[data-hero-foot]"), { y: 60, opacity: 0, duration: 0.22 }, 0);
        q("[data-hero-row]").forEach((row, i) => tl.to(row, { xPercent: dirs[i] * 80, duration: 0.22, ease: "power1.in" }, 0));
        q("[data-hero-card]").forEach((card, i) =>
          tl.fromTo(card, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.08 }, 0.38 + i * 0.045).to(card, { opacity: 0, duration: 0.07 }, 0.6),
        );
        tl.fromTo(q("[data-hero-tdcap]"), { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.5)
          .to(q("[data-hero-tdcap]"), { opacity: 0, duration: 0.05 }, 0.62)
          .fromTo(q("[data-hero-dive]"), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.9);
      });
    },
    { scope: root, dependencies: [three], revertOnUpdate: true },
  );

  const portrait = settings.portrait;

  return (
    <section
      ref={root}
      id="hero"
      aria-labelledby="hero-title"
      className="group/hero relative flex flex-col overflow-clip bg-[radial-gradient(110%_80%_at_68%_52%,var(--color-paper-hi)_0%,var(--color-paper)_55%,#ece1cd_100%)] pb-14 min-[900px]:block min-[900px]:h-svh min-[900px]:min-h-[680px] min-[900px]:pb-0"
    >
      {/* Masthead */}
      <div className="relative z-[1] order-1 px-[max(16px,env(safe-area-inset-left))] pt-[calc(env(safe-area-inset-top)+96px)] min-[900px]:pointer-events-none min-[900px]:absolute min-[900px]:inset-x-0 min-[900px]:top-0 min-[900px]:pl-[max(48px,env(safe-area-inset-left))] min-[900px]:pt-[calc(env(safe-area-inset-top)+108px)]">
        <div data-hero-kicker className="mb-[18px] ml-1 flex items-center gap-2.5">
          <Label>Full-stack developer · Pakistan</Label>
        </div>
        <h1
          id="hero-title"
          aria-label="Websites with the systems built in."
          className="whitespace-nowrap font-display text-[clamp(30px,10vw,64px)] font-extrabold uppercase leading-[0.86] tracking-[-0.045em] [font-variation-settings:'wdth'_108] min-[900px]:text-[min(9.4vw,15vh)]"
        >
          {lines.map((l, i) => (
            <span key={l} aria-hidden="true" data-hero-row className="block overflow-hidden pb-[0.04em]">
              <span data-hero-line className="inline-block">
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
      </div>

      {/* Slab + live caption */}
      <div
        data-hero-anchor
        className="@container relative z-[2] order-3 mx-auto mt-10 w-[min(92vw,560px)] px-0 min-[900px]:absolute min-[900px]:left-[71%] min-[900px]:top-[53%] min-[900px]:mt-0 min-[900px]:w-[min(47vw,82vh,780px)] min-[900px]:-translate-x-1/2 min-[900px]:-translate-y-1/2"
      >
        {/* HTML slab. Hidden once the 3D slab is up, but shown again for keyboard focus. */}
        <div
          data-html-slab
          className={cn(
            "transition-opacity duration-500",
            sceneReady && "pointer-events-none opacity-0 focus-within:pointer-events-auto focus-within:opacity-100",
          )}
        >
          <motion.div style={{ rotateX: rx, rotateY: ry, transformPerspective: 1400 }} className="max-[899px]:transform-none!">
            <HeroSlab {...live} onToggle={live.toggle} storefront={storefront} stripRef={strip} ledRef={led} />
          </motion.div>
          {/* contact shadow */}
          <div
            aria-hidden="true"
            className="mx-auto -mt-2 h-8 w-[86%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(17_17_17/.28),transparent)] blur-md"
          />
        </div>
        <p
          data-hero-caption
          aria-live="polite"
          className="raised-sm mt-4 flex items-center gap-2.5 rounded-control bg-paper-hi/80 px-3.5 py-2.5 text-[13.5px] leading-snug backdrop-blur-md min-[900px]:absolute min-[900px]:bottom-[16%] min-[900px]:right-[calc(100%+12px)] min-[900px]:mt-0 min-[900px]:w-[300px]"
        >
          <span aria-hidden="true" className="text-copper">
            ●
          </span>
          <span>
            <span className="type-label block text-[10px] text-walnut">Just now · {latest?.tag}</span>
            {latest?.text}
          </span>
        </p>
      </div>

      {three && (
        <>
          {/* 3D slab, crossfading over the HTML one. Hidden while the HTML slab has keyboard focus. */}
          <div
            className={cn(
              "absolute inset-0 z-[2] transition-opacity duration-700 group-has-[[data-html-slab]:focus-within]/hero:opacity-0",
              sceneReady ? "opacity-100" : "opacity-0",
            )}
          >
            <HeroScene stateRef={heroState} storefront={storefront} active={inView} onReady={() => setSceneReady(true)} />
          </div>

          {/* Teardown label cards: positioned by the scene, faded by the scroll timeline. */}
          {layerCards.map((c, i) => (
            <div
              key={c.title}
              ref={(el) => {
                heroState.current.cards[i] = el;
              }}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 z-[4] w-60 will-change-transform"
            >
              <div data-hero-card className="raised relative rounded-[14px] px-4 pb-[15px] pt-3.5 opacity-0">
                <Label>{c.label}</Label>
                <b className="my-[7px] block font-display text-2xl font-extrabold uppercase leading-none [font-variation-settings:'wdth'_115]">
                  {c.title}
                </b>
                <p className="text-[13.5px] leading-normal text-muted">{c.text}</p>
                <span className="absolute left-1/2 top-full h-[38px] w-px bg-ink/40" />
                <span className="absolute left-1/2 top-[calc(100%+36px)] -ml-[3px] size-[7px] rounded-full bg-copper shadow-glow" />
              </div>
            </div>
          ))}
          <div
            data-hero-tdcap
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[calc(env(safe-area-inset-bottom)+44px)] left-1/2 z-[4] -translate-x-1/2 whitespace-nowrap text-center opacity-0"
          >
            <Label>Every build ships with</Label>
            <strong className="mt-1.5 block font-display text-xl font-bold [font-variation-settings:'wdth'_110]">
              all three layers, designed together.
            </strong>
          </div>
          {/* The dive lands in the Services band, which is ink. */}
          <div data-hero-dive aria-hidden="true" className="pointer-events-none absolute inset-0 z-[6] bg-ink opacity-0" />
        </>
      )}

      {/* Phone: the three layers as a short stacked reveal (the teardown is desktop 3D). */}
      <ol className="wrap order-4 mt-8 flex flex-col gap-2 min-[900px]:hidden" aria-label="Every build ships with three layers">
        {[
          ["Website", "What customers see"],
          ["System", "What your team runs on"],
          ["Automation", "What runs without you"],
        ].map(([t, d]) => (
          <li key={t} data-rise-in className="raised flex items-baseline gap-3 rounded-control px-3.5 py-3">
            <b className="min-w-[110px] font-display text-base font-extrabold uppercase [font-variation-settings:'wdth'_112]">{t}</b>
            <span className="text-[13px] text-muted">{d}</span>
          </li>
        ))}
      </ol>

      {/* Bottom row */}
      <div
        data-hero-foot
        className="relative z-[3] order-2 flex flex-col gap-7 px-[max(16px,env(safe-area-inset-left))] pt-7 min-[900px]:pointer-events-none min-[900px]:absolute min-[900px]:inset-x-0 min-[900px]:bottom-[calc(env(safe-area-inset-bottom)+28px)] min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between min-[900px]:p-0 min-[900px]:px-[max(48px,env(safe-area-inset-left))] [&>*]:pointer-events-auto"
      >
        <div className="max-w-[410px]">
          <p data-rise-in className="text-[16.5px] leading-[1.55] text-muted max-[899px]:hidden">
            I&apos;m <strong className="font-semibold text-ink">Shayan Ahmed</strong>. I build the website your
            customers see and the system your team runs on, with agents that do the repetitive work while you
            approve every action.
          </p>
          <div data-rise-in className="flex flex-wrap gap-2.5 min-[900px]:mt-[18px] [&>*]:max-[899px]:flex-1">
            <Button href="#contact" arrow className="w-full">
              Start a project
            </Button>
            <Button href="#work" variant="paper" className="w-full">
              See the work
            </Button>
          </div>
        </div>

        <div data-rise-in className="hidden items-end gap-7 min-[1100px]:flex">
          <div className="flex flex-col gap-[3px]">
            <Label>Stack</Label>
            <b className="font-display text-sm font-bold [font-variation-settings:'wdth'_108]">Next.js · MERN</b>
          </div>
          <div className="flex flex-col gap-[3px]">
            <Label>Clients</Label>
            <b className="font-display text-sm font-bold [font-variation-settings:'wdth'_108]">Pakistan and abroad</b>
          </div>
          <button
            type="button"
            onClick={() => scrollTo("#services")}
            className="group flex cursor-pointer flex-col gap-[3px] text-left"
          >
            <Label>{three ? "Scroll to take it apart" : "Next: what I build"}</Label>
            <b className="flex items-center gap-1.5 font-display text-sm font-bold transition-colors [font-variation-settings:'wdth'_108] group-hover:text-walnut">
              Skip the story ↓
            </b>
          </button>
        </div>

        <a
          data-rise-in
          href="#contact"
          className="raised hidden items-center gap-3 rounded-[40px] py-[7px] pl-[7px] pr-[18px] min-[900px]:flex"
        >
          <span className="inset-track relative grid size-[42px] place-items-center overflow-hidden rounded-full">
            {portrait ? (
              <Image src={portrait.src} alt="" fill sizes="42px" className="object-cover" />
            ) : (
              <Keycap aria-hidden="true" className="h-[42px] min-w-[42px] rounded-full text-[12px]">
                SA
              </Keycap>
            )}
          </span>
          <span className="flex flex-col leading-tight">
            <small className="type-label flex items-center gap-1.5 text-[10px] text-muted">
              <StatusLight size="sm" on={false} pulse={false} />
              {settings.availability}
            </small>
            <strong className="text-sm font-semibold">Book a call</strong>
          </span>
        </a>
      </div>
    </section>
  );
}
