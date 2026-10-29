"use client";

import Image from "next/image";
import type { ImageRef, Project } from "@/lib/content/types";
import { Screen, type ScreenHandle } from "@/components/system";
import { cn } from "@/lib/utils";

type MonitorProps = {
  label?: string;
  screenRef?: React.Ref<ScreenHandle>;
  className?: string;
  children: React.ReactNode;
};

/** Ink monitor frame with a 16:10 screen. Used in Selected work and case study heroes. */
export function Monitor({ label, screenRef, className, children }: MonitorProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-panel bg-[linear-gradient(180deg,#2b2926,var(--color-ink-2))] p-3.5 shadow-[inset_0_1px_0_rgb(255_255_255/.12),0_40px_70px_-36px_rgb(17_17_17/.75)]",
        className,
      )}
    >
      <div className="flex items-center gap-[7px] px-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <i key={i} className="block size-[9px] rounded-full bg-ink-3 shadow-[inset_0_1px_1px_rgb(0_0_0/.6)]" />
        ))}
        {label && (
          <span className="ml-auto font-mono text-[10.5px] tracking-[0.06em] text-muted-ink">{label}</span>
        )}
      </div>
      <Screen ref={screenRef} className="relative aspect-[16/10]">
        {children}
      </Screen>
    </div>
  );
}

/** A screenshot filling the monitor screen. */
export function MonitorImage({ image, priority }: { image: ImageRef; priority?: boolean }) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      priority={priority}
      sizes="(min-width: 1240px) 660px, (min-width: 900px) 55vw, 92vw"
      className="object-cover object-top"
    />
  );
}

/** Shown while a project has no screenshot yet: a quiet title card, never placeholder text. */
export function MonitorStandby({ project }: { project: Project }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(80%_70%_at_50%_40%,#23201c,#0e0d0c)] p-6 text-center">
      <div className="relative z-[3]">
        <p className="type-label text-[10px] text-copper">{project.kind}</p>
        <p className="mt-3 font-display text-[clamp(28px,4vw,52px)] font-extrabold leading-[0.9] tracking-[-0.03em] text-paper/90 [font-variation-settings:'wdth'_104]">
          {project.title}
        </p>
      </div>
    </div>
  );
}

/** Code-built owner panel (example data), used when there is no owner screenshot. */
export function AgentsDashboard({ agents }: { agents: NonNullable<Project["agents"]> }) {
  return (
    <div className="absolute inset-0 grid grid-rows-[auto_1fr] gap-3 p-4 text-[12.5px]">
      <div className="relative z-[3] flex items-center justify-between">
        <b className="font-display text-[15px] [font-variation-settings:'wdth'_110]">Agents</b>
        <span className="type-label text-[10px] text-muted-ink">Example data · owner panel</span>
      </div>
      <ul className="relative z-[3] grid content-start gap-2 min-[900px]:grid-cols-2">
        {agents.map((a, i) => (
          <li
            key={a.name}
            className={cn(
              "flex items-center justify-between gap-2 rounded-[9px] bg-paper/5 px-[11px] py-[9px] shadow-[inset_0_0_0_1px_rgb(243_234_219/.07)]",
              i >= 4 && "max-[899px]:hidden",
            )}
          >
            <span className="truncate">{a.name}</span>
            <em className={cn("whitespace-nowrap font-mono text-[10px] not-italic tracking-[0.06em]", a.needsYou ? "text-copper" : "text-muted-ink")}>
              {a.status}
            </em>
          </li>
        ))}
      </ul>
    </div>
  );
}
