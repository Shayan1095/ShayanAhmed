"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, ViewTransition } from "react";
import type { Project } from "@/lib/content/types";
import { ProjectTile } from "@/components/site/project-tile";
import { Label, Tag } from "@/components/system";
import { code, ProjectSheet } from "./archive-rows";
import { cn } from "@/lib/utils";
import { morphName } from "@/components/site/responsive-morph";

/**
 * Selected work on phones (motion spec, Phase 4): a swipeable row of case
 * cards, 88% of the screen wide with the next one peeking. Native scrolling
 * with snap points (no JS scrolling); dots under the row show where you are
 * and jump to a card.
 *
 * The archive is merged in on phones (motion spec, Phase 3): after the case
 * studies come the other builds as smaller cards (tap opens their details in
 * a sheet), then a last card for the full list.
 */
export function WorkSnapRow({
  projects,
  more = [],
  codeStart = 1,
  total,
}: {
  projects: Project[];
  more?: Project[];
  codeStart?: number;
  total?: number;
}) {
  const row = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<Project | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const count = projects.length + more.length + (more.length ? 1 : 0);

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
  }, [count]);

  const all = [...projects, ...more];
  const dotLabel = (i: number) => all[i]?.title ?? "See all builds";

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
                {/* Morphs into the case study's main screen when opened (same name as its monitor). */}
                {/* Its own name (the slide's monitor has the desktop one); case pages match it on phones. */}
                <ViewTransition name={morphName(p.slug, true)} share="morph" default="none">
                  <ProjectTile project={p} className="aspect-[16/10] w-full" />
                </ViewTransition>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex flex-wrap gap-2">
                    <Tag>{p.statusLabel ?? p.kind}</Tag>
                  </div>
                  <h3 className="font-display text-[26px] font-extrabold leading-[1.02] tracking-[-0.02em]">{p.title}</h3>
                  <p className="line-clamp-3 text-[16px] text-muted">{p.outcome ?? p.summary}</p>
                  {href && (
                    <Link transitionTypes={["nav-forward"]}
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
        {more.map((p, i) => (
          <li key={p.slug} className="w-[72vw] max-w-[320px] shrink-0 snap-start">
            <button
              type="button"
              onClick={() => setOpen(p)}
              aria-haspopup="dialog"
              className="press flex h-full w-full flex-col overflow-hidden rounded-[22px] bg-paper-hi text-left shadow-raised"
            >
              <ProjectTile project={p} label={false} sizes="72vw" className="aspect-[16/10] w-full" />
              <span className="flex flex-1 flex-col gap-2 p-5">
                <span className="flex items-center gap-2.5">
                  <Label accent>{code(codeStart + i)}</Label>
                  <Label className="truncate">{p.kind}</Label>
                </span>
                <span className="font-display text-[22px] font-extrabold leading-[1.05] tracking-[-0.01em]">{p.title}</span>
                <span className="mt-auto pt-1 text-[15px] font-semibold text-copper">
                  Details <span aria-hidden="true">↑</span>
                </span>
              </span>
            </button>
          </li>
        ))}
        {more.length > 0 && (
          <li className="w-[60vw] max-w-[260px] shrink-0 snap-start">
            <Link
              href="/work"
              className="press flex h-full flex-col justify-end gap-2 rounded-[22px] p-5 shadow-[inset_0_0_0_1.5px_var(--color-paper-edge)]"
            >
              <span className="font-display text-[56px] font-extrabold leading-none text-copper">{total ? String(total).padStart(2, "0") : ""}</span>
              <span className="font-display text-[22px] font-extrabold leading-[1.05]">See all builds</span>
              <span aria-hidden="true" className="text-[20px] text-copper">
                →
              </span>
            </Link>
          </li>
        )}
      </ul>
      <ProjectSheet project={open} code={open ? code(codeStart + more.indexOf(open)) : ""} onClose={close} />
      {count > 1 && (
        <div className="mt-4 flex justify-center gap-1" role="group" aria-label="Choose a case study">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${dotLabel(i)}, ${i + 1} of ${count}`}
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
