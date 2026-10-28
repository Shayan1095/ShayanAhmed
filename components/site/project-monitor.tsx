"use client";

import { ViewTransition } from "react";
import type { Project } from "@/lib/content/types";
import type { ScreenHandle } from "@/components/system";
import { cn } from "@/lib/utils";
import { AgentsDashboard, Monitor, MonitorImage, MonitorStandby } from "./monitor";

export type MonitorView = "customer" | "owner";

export function hasOwnerView(project: Project) {
  return Boolean(project.ownerView || project.agents?.length);
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
  className,
}: {
  project: Project;
  view: MonitorView;
  screenRef?: React.Ref<ScreenHandle>;
  priority?: boolean;
  className?: string;
}) {
  const customer = project.customerView ?? project.cover;
  const views: Record<MonitorView, React.ReactNode> = {
    customer: customer ? <MonitorImage image={customer} priority={priority} /> : <MonitorStandby project={project} />,
    owner: project.ownerView ? (
      <MonitorImage image={project.ownerView} />
    ) : project.agents ? (
      <AgentsDashboard agents={project.agents} />
    ) : null,
  };
  const label =
    view === "owner" && project.monitorLabel
      ? project.monitorLabel.replace(/·.*$/, "· admin / agents")
      : project.monitorLabel;

  return (
    <ViewTransition name={`monitor-${project.slug}`} share="morph" default="none">
      <Monitor label={label} screenRef={screenRef} className={className}>
        {(Object.keys(views) as MonitorView[]).map((v) =>
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
    </ViewTransition>
  );
}
