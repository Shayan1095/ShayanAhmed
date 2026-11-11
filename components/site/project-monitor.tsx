"use client";

import { ViewTransition } from "react";
import { usePhone } from "@/lib/use-phone";
import { morphName } from "./responsive-morph";
import type { Project } from "@/lib/content/types";
import type { ScreenHandle } from "@/components/system";
import { cn } from "@/lib/utils";
import { AgentsDashboard, Monitor, MonitorStandby } from "./monitor";
import { hasMedia, ProjectMedia } from "./project-media";

export type MonitorView = "customer" | "owner";

export function hasOwnerView(project: Project) {
  return Boolean(hasMedia(project, "owner") || project.agents?.length);
}

/**
 * A project's monitor: customer view (screenshot or standby card) and owner
 * view (screenshot or code-built agents panel). The same ViewTransition name
 * on the homepage and the case study morphs one into the other on navigation.
 */
export function ProjectMonitor({
  project,
  view,
  screenRef,
  priority,
  responsive = false,
  className,
}: {
  project: Project;
  view: MonitorView;
  screenRef?: React.Ref<ScreenHandle>;
  priority?: boolean;
  /** Case pages: match the phone card's name on phones (the home slide always uses the desktop name). */
  responsive?: boolean;
  className?: string;
}) {
  const phone = usePhone();
  // Each side is ProjectMedia: its recording (playing while the frame is half
  // on screen, never with reduced motion or Data Saver) over its still. The
  // customer side falls back to the title card, the owner side to the
  // code-built agents panel (example data).
  const sizes = "(min-width: 1240px) 660px, (min-width: 900px) 55vw, 92vw";
  const views: Record<MonitorView, React.ReactNode> = {
    customer: (
      <ProjectMedia
        project={project}
        view="customer"
        active={view === "customer"}
        fill
        sizes={sizes}
        priority={priority}
        fallback={<MonitorStandby project={project} />}
      />
    ),
    owner:
      hasMedia(project, "owner") || project.agents?.length ? (
        <ProjectMedia
          project={project}
          view="owner"
          active={view === "owner"}
          fill
          sizes={sizes}
          fallback={project.agents?.length ? <AgentsDashboard agents={project.agents} /> : null}
        />
      ) : null,
  };
  const label =
    view === "owner" && project.monitorLabel
      ? project.monitorLabel.replace(/·.*$/, "· admin / agents")
      : project.monitorLabel;

  return (
    <ViewTransition name={morphName(project.slug, responsive && phone)} share="morph" default="none">
      <Monitor label={label} screenRef={screenRef} className={className}>
        {(Object.keys(views) as MonitorView[]).map((v) =>
          views[v] ? (
            <div
              key={v}
              aria-hidden={view !== v}
              className={cn(
                // The toggle crossfades the two sides; the frame keeps its size.
                "absolute inset-0 transition-[opacity,transform] duration-[var(--dur-base)] ease-[var(--ease-inout)]",
                view !== v && "pointer-events-none scale-[1.03] opacity-0",
              )}
            >
              {views[v]}
            </div>
          ) : null,
        )}
      </Monitor>
    </ViewTransition>
  );
}
