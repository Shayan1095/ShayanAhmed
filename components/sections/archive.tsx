"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Project, ProjectCategory } from "@/lib/content/types";
import { Band, Cartridge, InsetToggle, Rise, SectionHeader } from "@/components/system";
import { ScrollTrigger } from "@/lib/gsap";
import { easeOutExpo } from "@/lib/motion";

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

/**
 * 03 Archive (cream). Filter in an inset track; the grid reflows with Motion
 * layout animation. Layers: motion wrapper (layout) > Rise (GSAP reveal) > Cartridge (Motion tilt).
 */
export function Archive({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  // Only offer filters that have projects behind them.
  const available = filters.filter((f) => f.value === "all" || projects.some((p) => matches[f.value](p.category)));
  const shown = projects.filter((p) => matches[filter](p.category));

  if (projects.length === 0) return null;

  return (
    <Band id="archive" aria-label="Archive" className="pb-20 pt-10 min-[900px]:pb-[120px]">
      <div className="wrap">
        <SectionHeader
          index="03"
          label="Archive"
          title={
            <>
              More <em>builds</em>
            </>
          }
          aside={<InsetToggle label="Filter projects" options={available} value={filter} onChange={setFilter} />}
          className="min-[900px]:mb-[34px]"
        />
        <motion.ul layout className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 min-[980px]:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false} onExitComplete={() => ScrollTrigger.refresh()}>
            {shown.map((p, i) => (
              <motion.li
                key={p.slug}
                layout
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.6, ease: easeOutExpo }}
              >
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
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </Band>
  );
}
