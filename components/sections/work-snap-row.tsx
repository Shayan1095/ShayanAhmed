"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/content/types";
import { ProjectTile } from "@/components/site/project-tile";
import { Tag } from "@/components/system";
import { cn } from "@/lib/utils";

/**
 * Selected work on phones (motion spec, Phase 4): a swipeable row of case
 * cards, 88% of the screen wide with the next one peeking. Native scrolling
 * with snap points (no JS scrolling); dots under the row show where you are
 * and jump to a card.
 */
export function WorkSnapRow({ projects }: { projects: Project[] }) {
  const row = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const cards = Array.from(el.children);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(cards.indexOf(e.target));
      },
      { root: el, threshold: 0.6 },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [projects.length]);

  const go = (i: number) => {
    const card = row.current?.children[i] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  return (
    <div>
      <ul
        ref={row}
        aria-label="Case studies"
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((p) => {
          const href = p.hasCaseStudy ? `/work/${p.slug}` : p.liveUrl;
          return (
            <li key={p.slug} className="w-[88vw] max-w-[420px] shrink-0 snap-start">
              <article className="press relative flex h-full flex-col overflow-hidden rounded-[22px] bg-paper-hi shadow-raised">
                <ProjectTile project={p} className="aspect-[16/10] w-full" />
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex flex-wrap gap-2">
                    <Tag>{p.statusLabel ?? p.kind}</Tag>
                  </div>
                  <h3 className="font-display text-[26px] font-extrabold leading-[1.02] tracking-[-0.02em]">{p.title}</h3>
                  <p className="line-clamp-3 text-[16px] text-muted">{p.outcome ?? p.summary}</p>
                  {href && (
                    <Link
                      href={href}
                      className="mt-auto inline-flex min-h-11 items-center gap-2 text-[16px] font-semibold text-copper after:absolute after:inset-0 after:content-['']"
                    >
                      {p.hasCaseStudy ? "Read the case study" : "Visit the site"}
                      <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
      {projects.length > 1 && (
        <div className="mt-4 flex justify-center gap-1" role="group" aria-label="Choose a case study">
          {projects.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              aria-label={`${p.title}, ${i + 1} of ${projects.length}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => go(i)}
              className="grid size-11 place-items-center"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "block h-1.5 rounded-full transition-[width,background-color] duration-[260ms] ease-out-expo",
                  i === active ? "w-6 bg-copper" : "w-1.5 bg-paper-edge",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
