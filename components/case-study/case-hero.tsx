"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Project } from "@/lib/content/types";
import { hasOwnerView, ProjectMonitor, type MonitorView } from "@/components/site/project-monitor";
import { Button, InsetToggle, Label, SplitReveal, StatusBadge, Tag, type ScreenHandle } from "@/components/system";

/** Case study hero (DESIGN.md §9.1): monitor (morph target), title, status, stack, link. */
export function CaseHero({ project, index, total }: { project: Project; index: number; total: number }) {
  const screen = useRef<ScreenHandle>(null);
  const [view, setView] = useState<MonitorView>("customer");
  const hasOwner = hasOwnerView(project);

  const meta = [
    { label: "Type", value: project.kind },
    project.stack.length > 0 && { label: "Stack", value: project.stack.join(" · ") },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <section aria-labelledby="case-title" className="pb-16 pt-[calc(env(safe-area-inset-top)+112px)] min-[900px]:pb-24">
      <div className="wrap">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/#work" className="type-label text-muted transition-colors hover:text-ink">
            ← All work
          </Link>
          <Label>
            Case study · {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </Label>
        </div>

        <div className="grid grid-cols-1 items-start gap-10 min-[1000px]:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] min-[1000px]:gap-14">
          <div className="min-[1000px]:sticky min-[1000px]:top-28">
            <ProjectMonitor project={project} view={view} screenRef={screen} priority />
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={project.status}>{project.statusLabel}</StatusBadge>
              <Tag>{project.kind}</Tag>
            </div>
            <SplitReveal
              as="h1"
              id="case-title"
              start="top bottom"
              className="font-display text-[clamp(44px,6.4vw,96px)] font-extrabold leading-[0.95] tracking-[-0.03em] [font-variation-settings:'wdth'_104]"
            >
              {project.title}
            </SplitReveal>
            <p className="max-w-[34em] text-lg leading-relaxed text-muted">{project.summary}</p>

            {hasOwner && (
              <InsetToggle
                label="Monitor view"
                value={view}
                onChange={(v) => {
                  setView(v);
                  screen.current?.boot();
                }}
                options={[
                  { value: "customer", label: "Customer view" },
                  { value: "owner", label: "Owner view" },
                ]}
              />
            )}

            <dl className="grid grid-cols-[auto_minmax(0,1fr)] border-t border-paper-edge">
              {meta.map((m) => (
                <div key={m.label} className="contents">
                  <dt className="type-label border-b border-paper-edge py-3 pr-6 text-[10.5px] text-muted">{m.label}</dt>
                  <dd className="border-b border-paper-edge py-3 text-[15px] font-medium">{m.value}</dd>
                </div>
              ))}
              <div className="contents">
                <dt className="type-label border-b border-paper-edge py-3 pr-6 text-[10.5px] text-muted">Live</dt>
                <dd className="border-b border-paper-edge py-3 text-[15px] font-medium">
                  {project.liveUrl ? (
                    <a href={project.liveUrl} target="_blank" rel="noopener" className="underline decoration-paper-edge underline-offset-4 hover:decoration-walnut">
                      {project.liveUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} ↗
                    </a>
                  ) : (
                    (project.demoNote ?? "Demo on request")
                  )}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-3">
              <Button href="/#contact" arrow>
                Start a project like this
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
