"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { SocialLink } from "@/lib/content/socials";
import { SALogo } from "@/components/brand/sa-logo";
import { BrandGlyph } from "@/components/site/brand-glyph";
import { Band, CoverGrid, Label, SplitReveal } from "@/components/system";
import { cn } from "@/lib/utils";

/*
 * Orbit geometry, in container-width units (cqw) of the stage, which is
 * 10:7. A tilted orbit seen from above: wide and flat ellipses. Icons on the
 * lower half are "in front" (bigger, brighter, over the core); on the upper
 * half they pass behind it. Positions use cqw, so the server can render
 * every icon in place before any JavaScript runs.
 */
const RINGS = [
  { rx: 25, ry: 13.5, period: 26, dir: 1 }, // inner: quicker
  { rx: 43, ry: 24, period: 44, dir: -1 }, // outer: slower, the other way
] as const;

type Placed = { link: SocialLink; ring: 0 | 1; base: number };

/** Inner ring takes up to three, the rest go outside; a lone ring uses the outer one. */
function place(links: SocialLink[]): Placed[] {
  const inner = links.length > 4 ? links.slice(0, Math.min(3, Math.ceil(links.length / 3))) : [];
  const outer = links.slice(inner.length);
  const spread = (list: SocialLink[], ring: 0 | 1, offset: number) =>
    list.map((link, i) => ({ link, ring, base: offset + (i / list.length) * Math.PI * 2 }));
  return [...spread(inner, 0, -Math.PI / 2), ...spread(outer, 1, Math.PI / 5)];
}

function pose(ring: 0 | 1, angle: number) {
  const r = RINGS[ring];
  const x = Math.cos(angle) * r.rx;
  const y = Math.sin(angle) * r.ry;
  const depth = (Math.sin(angle) + 1) / 2; // 0 back, 1 front
  return {
    transform: `translate3d(calc(${x.toFixed(3)}cqw - 50%), calc(${y.toFixed(3)}cqw - 50%), 0) scale(${(0.8 + depth * 0.3).toFixed(3)})`,
    opacity: (0.55 + depth * 0.45).toFixed(3),
    zIndex: depth > 0.5 ? 20 : 2,
  };
}

/**
 * "Find me elsewhere" (home page, before Contact): the social links as real
 * brand logos orbiting the SA core. Hovering or focusing a logo glides the
 * orbit to a stop and shows its name; touching the orbit on a phone pauses
 * it so a logo is easy to tap; a button pauses it for good. One rAF loop
 * writes transforms only, and runs only while the section is on screen.
 * Reduced motion: the logos rest in place around the core.
 */
export function SocialOrbit({ links }: { links: SocialLink[] }) {
  const preview = links.some((l) => l.preview);
  const stage = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const holdRef = useRef(0); // hover / focus / touch hold count
  const touchUntil = useRef(0);
  const near = useRef(false); // pointer over the orbit: slow down so logos are easy to catch
  const placed = place(links);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const el = stage.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const offset = [0, 0];
    let speed = 1;
    let raf = 0;
    let last = 0;
    const frame = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      const stop = pausedRef.current || holdRef.current > 0 || t < touchUntil.current;
      const target = stop ? 0 : near.current ? 0.25 : 1;
      // Brake quickly (a logo stays under the cursor), pick up speed gently.
      speed += (target - speed) * Math.min(1, dt * (target < speed ? 10 : 2.2));
      RINGS.forEach((r, i) => (offset[i] += ((dt * speed * Math.PI * 2) / r.period) * r.dir));
      placed.forEach((p, i) => {
        const li = items.current[i];
        if (!li) return;
        const s = pose(p.ring, p.base + offset[p.ring]);
        li.style.transform = s.transform;
        li.style.opacity = s.opacity;
        li.style.zIndex = String(s.zIndex);
      });
      raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      last = 0;
      if (e.isIntersecting) raf = requestAnimationFrame(frame);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // placed is derived from links; re-run only when the set of links changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links.map((l) => l.key).join()]);

  const hold = (on: boolean) => (holdRef.current = Math.max(0, holdRef.current + (on ? 1 : -1)));

  if (links.length === 0) return null;

  return (
    <Band tone="ink" id="elsewhere" aria-labelledby="elsewhere-title" className="section-pad overflow-hidden">
      <CoverGrid strength={0.35} />
      <div className="wrap relative grid grid-cols-1 items-center gap-10 min-[980px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] min-[980px]:gap-14">
        <div>
          <Label accent className="mb-3.5 block min-[640px]:mb-[18px]">
            Find me elsewhere
          </Label>
          <SplitReveal as="h2" className="type-section">
            <span id="elsewhere-title">
              Follow <em>the build.</em>
            </span>
          </SplitReveal>
          <p className="mt-4 max-w-[30em] text-[17px] text-tone-muted">
            New builds, behind-the-scenes and quick tips. Pick a planet; it opens in a new tab.
          </p>
          {preview && (
            <p className="mt-4 max-w-[30em] rounded-[12px] border border-dashed border-copper/40 px-4 py-3 font-mono text-[12.5px] text-copper">
              Preview: dashed logos are stand-ins. Add them in Admin → Settings; the live site shows saved profiles only.
            </p>
          )}
          <p className="mt-6 text-[15px] text-tone-muted">
            Prefer to talk?{" "}
            <Link href="#contact" className="font-semibold text-copper underline-offset-4 hover:underline">
              Start a project
            </Link>
          </p>
        </div>

        <div className="relative">
          <div
            ref={stage}
            onPointerEnter={(e) => e.pointerType === "mouse" && (near.current = true)}
            onPointerLeave={(e) => e.pointerType === "mouse" && (near.current = false)}
            onPointerDown={(e) => {
              // Phones: a touch on the orbit holds it still for a moment, so a logo is easy to tap.
              if (e.pointerType !== "mouse") touchUntil.current = performance.now() + 3200;
            }}
            className="relative mx-auto aspect-[10/7] w-full max-w-[640px] [container-type:inline-size]"
          >
            {/* The two orbit paths, drawn as tilted ellipses; their dashes drift slowly. */}
            <svg aria-hidden="true" viewBox="0 0 100 70" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
              {RINGS.map((r, i) => (
                <ellipse
                  key={i}
                  cx="50"
                  cy="35"
                  rx={r.rx}
                  ry={r.ry}
                  fill="none"
                  stroke="rgb(232 178 122 / .22)"
                  strokeWidth="1"
                  strokeDasharray="2 5"
                  vectorEffect="non-scaling-stroke"
                  className={cn("orbit-path", i === 1 && "[animation-direction:reverse]")}
                />
              ))}
            </svg>

            {/* The core: the SA mark in a soft, breathing copper glow. */}
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
              <span className="orbit-halo absolute left-[calc(50%-15cqw)] top-[calc(50%-15cqw)] size-[30cqw] rounded-full bg-[radial-gradient(circle,rgb(201_133_63/.38),rgb(201_133_63/.08)_45%,transparent_70%)]" />
              <SALogo size={88} className="relative size-[clamp(64px,14cqw,104px)] drop-shadow-[0_10px_30px_rgb(0_0_0/.6)]" title="" />
            </div>

            <ul aria-label="Social profiles" className="absolute inset-0">
              {placed.map((p, i) => {
                const s = pose(p.ring, p.base);
                const label = p.link.key === "email" ? "Email Shayan" : `Shayan on ${p.link.label}`;
                return (
                  <li
                    key={p.link.key}
                    ref={(el) => {
                      items.current[i] = el;
                    }}
                    className="absolute left-1/2 top-1/2 will-change-transform"
                    style={{ transform: s.transform, opacity: s.opacity, zIndex: s.zIndex }}
                    onPointerEnter={(e) => e.pointerType === "mouse" && hold(true)}
                    onPointerLeave={(e) => e.pointerType === "mouse" && hold(false)}
                    onFocus={() => hold(true)}
                    onBlur={() => hold(false)}
                  >
                    <a
                      href={p.link.preview ? undefined : p.link.href}
                      target={p.link.external && !p.link.preview ? "_blank" : undefined}
                      rel={p.link.external ? "noopener noreferrer" : undefined}
                      aria-label={`${label}${p.link.preview ? " (stand-in)" : p.link.external ? " (opens in a new tab)" : ""}`}
                      aria-disabled={p.link.preview || undefined}
                      tabIndex={p.link.preview ? 0 : undefined}
                      className={cn(p.link.preview && "border border-dashed border-copper/40", "group/planet relative grid size-12 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#2b2622,#141110_70%)] shadow-[inset_0_1px_0_rgb(255_255_255/.1),0_0_0_1px_rgb(255_255_255/.07),0_14px_28px_-12px_rgb(0_0_0/.9)] transition-[transform,box-shadow] duration-200 ease-out-expo hover:scale-110 hover:shadow-[inset_0_1px_0_rgb(255_255_255/.14),0_0_0_1px_rgb(232_178_122/.5),0_0_28px_-4px_rgb(201_133_63/.55)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper active:scale-95 min-[640px]:size-[60px]")}
                    >
                      <BrandGlyph platform={p.link.key} className="size-[22px] min-[640px]:size-[27px]" />
                      {/* Name tag on hover / keyboard focus. */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full bg-[#f3eadb] px-3 py-1 text-[13px] font-semibold text-[#140d08] opacity-0 shadow-[0_8px_18px_-8px_rgb(0_0_0/.8)] transition-[opacity,transform] duration-200 group-hover/planet:translate-y-0 group-hover/planet:opacity-100 group-focus-visible/planet:translate-y-0 group-focus-visible/planet:opacity-100"
                      >
                        {p.link.label}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Moving content needs a way to stop it (WCAG 2.2.2). */}
          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            aria-pressed={paused}
            className="ml-auto mt-2 flex min-h-11 items-center gap-2 rounded-full px-3 font-mono text-[12px] uppercase tracking-[0.12em] text-tone-muted transition-colors hover:text-copper motion-reduce:hidden"
          >
            {paused ? <Play aria-hidden="true" className="size-3.5" /> : <Pause aria-hidden="true" className="size-3.5" />}
            {paused ? "Play orbit" : "Pause orbit"}
          </button>
        </div>
      </div>
    </Band>
  );
}
