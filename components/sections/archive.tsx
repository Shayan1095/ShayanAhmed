"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Project, ProjectCategory } from "@/lib/content/types";
import { ScrollFx } from "@/components/fx/scroll-fx";
import { Band, Cartridge, InsetToggle, Rise, SectionHeader } from "@/components/system";
import { type FlipState, gsap, lazyFlip, MQ, ScrollTrigger, useGSAP, whenIdle } from "@/lib/gsap";
import { motionGrammar } from "@/lib/motion";
import { ArchiveRows } from "./archive-rows";

const filters = [
  { value: "all", label: "All" },
  { value: "systems", label: "Systems" },
  { value: "web", label: "Web tools" },
  { value: "auto", label: "Automations" },
] as const;

type Filter = (typeof filters)[number]["value"];

const matches: Record<Filter, (c: ProjectCategory) => boolean> = {
  all: () => true,
  systems: (c) => c === "system",
  web: (c) => c === "web-tool" || c === "website",
  auto: (c) => c === "automation",
};

/** Column drift speeds for the preview grid: middle column travels furthest. */
const COLUMN_SPEED = [0.18, 0.5, 0.3];

type ArchiveProps = {
  projects: Project[];
  /** Homepage preview: show only this many, without the filter. */
  limit?: number;
  /** Link to the full list, shown with a preview. */
  seeAllHref?: string;
  index?: string;
  className?: string;
  /** First project code on the phone rows (SA–03 when two case studies come first). */
  codeStart?: number;
};

/**
 * Archive of builds. On the homepage a short, calm preview; on /work the full
 * list with a filter. Filtering uses GSAP Flip: every card stays in the page,
 * the ones that remain glide to their new places, the rest shrink away.
 */
export function Archive({ projects, limit, seeAllHref, index = "03", className, codeStart = 1 }: ArchiveProps) {
  const filterable = !limit;
  const [filter, setFilter] = useState<Filter>("all");
  const grid = useRef<HTMLUListElement>(null);
  const flipState = useRef<FlipState | null>(null);
  // Flip is only needed once the filter is used; fetch it while the page is idle.
  useEffect(() => (filterable ? whenIdle(() => void lazyFlip.load()) : undefined), [filterable]);
  const available = filters.filter((f) => f.value === "all" || projects.some((p) => matches[f.value](p.category)));
  const list = limit ? projects.slice(0, limit) : projects;
  const shown = filterable ? projects.filter((p) => matches[filter](p.category)) : list;

  const changeFilter = (next: Filter) => {
    // Record where every card is now, then let React apply the filter.
    const Flip = lazyFlip.get();
    if (Flip && grid.current && !window.matchMedia(MQ.reduce).matches) {
      flipState.current = Flip.getState(grid.current.querySelectorAll("[data-flip]"));
    }
    setFilter(next);
  };

  // After the filter renders, animate from the recorded positions.
  useGSAP(
    () => {
      const state = flipState.current;
      const Flip = lazyFlip.get();
      if (!state || !Flip) return;
      flipState.current = null;
      Flip.from(state, {
        duration: 0.75,
        ease: motionGrammar.easeToggle,
        absolute: true,
        stagger: 0.03,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6, ease: motionGrammar.ease, delay: 0.15 }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.35, ease: "power1.in" }),
        onComplete: () => ScrollTrigger.refresh(),
      });
    },
    { dependencies: [filter], scope: grid },
  );

  if (projects.length === 0) return null;
  const more = limit ? projects.length - shown.length : 0;

  return (
    <Band id="archive" aria-label="More builds" className={className ?? "section-pad"}>
      <div className="wrap">
        <SectionHeader
          index={index}
          label="Archive"
          title={
            <>
              More <em>builds</em>
            </>
          }
          intro={filterable ? undefined : "Systems, tools and automations built for clients and as products."}
          aside={filterable ? <InsetToggle label="Filter projects" options={available} value={filter} onChange={changeFilter} /> : undefined}
          className="min-[900px]:mb-[40px]"
        />
        {/* Signature: columns drift at different speeds as the grid passes (preview only; the filtered grid reflows instead). */}
        {/* Phones: compact index rows; a tap opens the details in a bottom sheet. */}
        <div className="min-[768px]:hidden">
          <ArchiveRows projects={shown} codeStart={codeStart} />
        </div>
        <ScrollFx effects={filterable ? [] : ["parallax"]} className="max-[767px]:hidden">
        <ul ref={grid} className="grid grid-cols-1 gap-[22px] min-[640px]:grid-cols-2 min-[980px]:grid-cols-3">
            {list.map((p, i) => (
              <li
                key={p.slug}
                data-flip={p.slug}
                hidden={!shown.includes(p)}
              >
                <div data-fx-speed={filterable ? undefined : COLUMN_SPEED[i % 3]} className="h-full">
                <Rise delay={(i % 3) * 0.06} className="h-full">
                  <Cartridge
                    title={p.title}
                    kind={p.kind}
                    status={p.status}
                    summary={p.summary}
                    fact={p.fact}
                    href={p.hasCaseStudy ? `/work/${p.slug}` : undefined}
                    shot={
                      p.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.cover.src}
                          alt={p.cover.alt}
                          width={p.cover.width}
                          height={p.cover.height}
                          loading="lazy"
                          className="absolute inset-0 size-full object-cover object-top"
                        />
                      ) : undefined
                    }
                  />
                </Rise>
                </div>
              </li>
            ))}
        </ul>
        </ScrollFx>
        {seeAllHref && more > 0 && (
          <div className="mt-10 flex justify-center">
            <Link
              href={seeAllHref}
              className="group inline-flex items-center gap-3 rounded-control px-4 py-3 text-[15px] font-semibold text-ink transition-colors hover:text-walnut"
            >
              See all {projects.length} builds
              <span aria-hidden="true" className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        )}
      </div>
    </Band>
  );
}
