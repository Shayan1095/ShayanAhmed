"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
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

type ArchiveProps = {
  projects: Project[];
  /** Homepage preview: show only this many, without the filter. */
  limit?: number;
  /** Link to the full list, shown with a preview. */
  seeAllHref?: string;
  index?: string;
  className?: string;
};

/**
 * Archive of builds. On the homepage a short, calm preview; on /work the full
 * list with a filter whose grid reflows with Motion layout animation.
 */
export function Archive({ projects, limit, seeAllHref, index = "03", className }: ArchiveProps) {
  const filterable = !limit;
  const [filter, setFilter] = useState<Filter>("all");
  const available = filters.filter((f) => f.value === "all" || projects.some((p) => matches[f.value](p.category)));
  const shown = (filterable ? projects.filter((p) => matches[filter](p.category)) : projects).slice(0, limit);

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
          aside={filterable ? <InsetToggle label="Filter projects" options={available} value={filter} onChange={setFilter} /> : undefined}
          className="min-[900px]:mb-[40px]"
        />
        <motion.ul layout={filterable} className="grid grid-cols-1 gap-[22px] min-[640px]:grid-cols-2 min-[980px]:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false} onExitComplete={() => ScrollTrigger.refresh()}>
            {shown.map((p, i) => (
              <motion.li
                key={p.slug}
                layout={filterable}
                initial={{ opacity: 0, scale: 0.94, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
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
