"use client";

import { useRef, useState } from "react";
import type { Project } from "@/lib/content/types";
import { AgentsDashboard, Monitor, MonitorImage, MonitorStandby } from "@/components/site/monitor";
import { Button, InsetToggle, StatusBadge, Tag, UiFragment, type ScreenHandle } from "@/components/system";
import { cn } from "@/lib/utils";

type View = "customer" | "owner";

/** Fragment spots around the monitor, mirrored on alternate slides. data-speed drives parallax. */
const spots = [
  [
    { style: { left: -28, top: "18%" }, speed: 1.2 },
    { style: { right: -24, top: "40%" }, speed: -0.9 },
    { style: { left: "12%", bottom: -26 }, speed: 0.7 },
  ],
  [
    { style: { right: -26, top: "14%" }, speed: -1 },
    { style: { left: -26, top: "46%" }, speed: 0.8 },
    { style: { right: "14%", bottom: -24 }, speed: -0.6 },
  ],
] as const;

export function WorkSlide({ project, index }: { project: Project; index: number }) {
  const screen = useRef<ScreenHandle>(null);
  const [view, setView] = useState<View>("customer");
  const customer = project.customerView ?? project.cover;
  const hasOwner = Boolean(project.ownerView || project.agents?.length);
  const label =
    view === "owner" && project.monitorLabel
      ? project.monitorLabel.replace(/·.*$/, "· admin / agents")
      : project.monitorLabel;

  const changeView = (v: View) => {
    setView(v);
    screen.current?.boot();
  };

  const views: Record<View, React.ReactNode> = {
    customer: customer ? <MonitorImage image={customer} /> : <MonitorStandby project={project} />,
    owner: project.ownerView ? (
      <MonitorImage image={project.ownerView} />
    ) : project.agents ? (
      <AgentsDashboard agents={project.agents} />
    ) : null,
  };

  return (
    <article
      data-slide
      aria-labelledby={`work-${project.slug}`}
      className="grid grid-cols-1 items-center gap-7 min-[900px]:flex-[0_0_min(1120px,88vw)] min-[900px]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"
    >
      <div className="relative">
        <Monitor label={label} screenRef={screen}>
          {(Object.keys(views) as View[]).map((v) =>
            views[v] ? (
              <div
                key={v}
                aria-hidden={view !== v}
                className={cn(
                  "absolute inset-0 transition-[opacity,transform] duration-[450ms] ease-out-expo",
                  view !== v && "pointer-events-none scale-[1.03] opacity-0",
                )}
              >
                {views[v]}
              </div>
            ) : null,
          )}
        </Monitor>
        {project.uiFragments.map((f, i) => {
          const spot = spots[index % 2][i];
          if (!spot) return null;
          return (
            <div
              key={f.text}
              data-frag
              data-speed={spot.speed}
              style={spot.style}
              className={cn(
                "z-[2] will-change-transform",
                i === 0
                  ? "relative mt-3 max-[899px]:inset-auto! min-[900px]:absolute min-[900px]:mt-0"
                  : "absolute hidden min-[900px]:block",
              )}
            >
              <UiFragment
                tag={f.tag}
                text={f.text}
                actions={f.actions}
                live={i === 0}
                className="max-[899px]:w-full"
              />
            </div>
          );
        })}
      </div>

      <div className="raised relative flex flex-col gap-4 rounded-panel bg-[linear-gradient(170deg,var(--color-paper-hi),var(--color-paper)_60%,var(--color-paper-lo))] p-6 min-[1200px]:p-[30px] [@media(min-width:900px)_and_(max-height:820px)]:gap-3">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={project.status}>{project.statusLabel}</StatusBadge>
          <Tag>{project.kind}</Tag>
        </div>
        <h3
          id={`work-${project.slug}`}
          className="font-display text-[clamp(30px,3vw,38px)] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] [font-variation-settings:'wdth'_118]"
        >
          {project.title}
        </h3>
        <p className="text-[15.5px] text-muted">{project.summary}</p>
        {hasOwner && (
          <InsetToggle
            label="Monitor view"
            value={view}
            onChange={changeView}
            options={[
              { value: "customer", label: "Customer view" },
              { value: "owner", label: "Owner view" },
            ]}
          />
        )}
        {project.features.length > 0 && (
          // Short laptop screens drop the feature list here; the case study carries it in full.
          <ul className="grid grid-cols-2 border-t border-paper-edge [@media(min-width:900px)_and_(max-height:820px)]:hidden">
            {project.features.map((f, i) => (
              <li
                key={f.title}
                className="flex gap-2 border-b border-paper-edge py-[9px] text-[13.5px] odd:pr-2.5"
              >
                <b className="min-w-[22px] pt-0.5 font-mono text-[10.5px] font-normal text-muted">
                  {String(i + 1).padStart(2, "0")}
                </b>
                {f.title}
              </li>
            ))}
          </ul>
        )}
        {project.hasCaseStudy && (
          <Button href={`/work/${project.slug}`} arrow className="mt-auto self-start">
            Read the case study
          </Button>
        )}
      </div>
    </article>
  );
}
