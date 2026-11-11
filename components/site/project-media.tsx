"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ImageRef, Project, VideoSources } from "@/lib/content/types";
import { cn } from "@/lib/utils";

export type MediaView = "customer" | "owner";

type MediaProject = Pick<
  Project,
  "title" | "poster" | "cover" | "customerView" | "ownerView" | "video" | "videoCustomer" | "videoOwner" | "monitorLabel"
>;

/** First letters of the first two words: "Brands Attire" → "BA". */
export function initials(title: string) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

/**
 * The still for a side of a project. Customer side: the poster (first frame of
 * the recording), else the customer-view screenshot, else the cover. Owner
 * side: the owner-view screenshot, else the poster when there is an owner
 * recording to start from.
 */
export function posterFor(p: MediaProject, view: MediaView = "customer"): ImageRef | undefined {
  if (view === "owner") return p.ownerView ?? (p.videoOwner ? p.poster : undefined);
  return p.poster ?? p.customerView ?? p.cover;
}

/** The recording for a side: the customer side falls back to the main video. */
export function sourcesFor(p: MediaProject, view: MediaView = "customer"): (VideoSources & { src?: string }) | undefined {
  const v = view === "owner" ? p.videoOwner : (p.videoCustomer ?? p.video);
  return v && (v.mp4 || v.webm || ("src" in v && v.src)) ? v : undefined;
}

/** Whether a project has anything to show (a still or a recording) for a side. */
export function hasMedia(p: MediaProject, view: MediaView = "customer") {
  return Boolean(posterFor(p, view) || sourcesFor(p, view));
}

/** Autoplay is never allowed with reduced motion or Data Saver. */
function canAutoplay() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !conn?.saveData;
}
const finePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
/** Re-check when the visitor switches reduced motion on or off. */
function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * A project's media, used everywhere a project is shown (build brief, Phase 2):
 * the home case frames, archive cards, footer tiles, /work and case studies.
 *
 * - The wrapper has a fixed aspect ratio (or fills a parent frame), so media
 *   never shifts the layout. The still is a next/image with real `sizes`.
 * - A recording is muted, inline, looped and preload="none".
 *   play="inview": plays while at least half visible, pauses otherwise.
 *   play="hover": plays on hover, on mouse and trackpad devices only.
 *   Never with reduced motion or Data Saver: the still shows instead.
 * - `active` (the Customer / Owner toggle): an inactive side is paused.
 * - Nothing to show: the fallback (the monogram tile by default). Never an
 *   empty frame.
 */
export function ProjectMedia({
  project,
  view = "customer",
  play = "inview",
  active = true,
  fill = false,
  sizes = "(min-width: 900px) 55vw, 92vw",
  priority = false,
  label = true,
  fallback,
  className,
}: {
  project: MediaProject;
  view?: MediaView;
  play?: "inview" | "hover" | "never";
  active?: boolean;
  /** Fill a positioned parent (e.g. the monitor frame) instead of setting an aspect ratio. */
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  /** Show the monitor label under the initials on bigger fallback tiles. */
  label?: boolean;
  /** What to show with no still and no recording; defaults to the monogram tile. */
  fallback?: React.ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const still = posterFor(project, view);
  const sources = sourcesFor(project, view);
  // The video element exists only where autoplay is allowed (false on the
  // server), so reduced motion and Data Saver never even load it.
  const allowed = useSyncExternalStore(
    subscribeMotion,
    () => Boolean(sources) && play !== "never" && canAutoplay() && (play !== "hover" || finePointer()),
    () => false,
  );
  const [playing, setPlaying] = useState(false);
  const inView = useRef(false);
  const hovered = useRef(false);

  // Play/pause from visibility (inview) or the pointer (hover), and the toggle.
  const sync = () => {
    const v = video.current;
    if (!v) return;
    const want = active && (play === "inview" ? inView.current : hovered.current);
    if (want) void v.play().catch(() => {});
    else {
      v.pause();
      if (play === "hover") v.currentTime = 0;
    }
  };

  useEffect(() => {
    if (!allowed || play !== "inview") return;
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        inView.current = e.intersectionRatio >= 0.5;
        sync();
      },
      { threshold: [0, 0.5, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
    // sync reads refs and props at call time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, play]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(sync, [active]);

  const onEnter = (e: React.PointerEvent) => {
    if (play !== "hover" || e.pointerType !== "mouse") return;
    hovered.current = true;
    sync();
  };
  const onLeave = () => {
    if (play !== "hover") return;
    hovered.current = false;
    sync();
  };

  const nothing = !still && !sources;

  return (
    <span
      ref={root}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      className={cn(
        "tone-ink overflow-hidden bg-ink [container-type:inline-size]",
        // A fixed aspect ratio (16:10 unless the caller sets its own aspect-*), so media never shifts layout.
        fill ? "absolute inset-0 block" : cn("relative block", !/(^|\s)aspect-/.test(className ?? "") && "aspect-[16/10]"),
        className,
      )}
    >
      {still && (
        <Image
          src={still.src}
          alt={still.alt || ""}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover object-top"
        />
      )}

      {allowed && sources && (
        <video
          ref={video}
          muted
          playsInline
          loop
          preload="none"
          poster={still?.src}
          aria-hidden="true"
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          // The first frame fades in over the still once it is really playing (no black flash).
          className={cn(
            "absolute inset-0 size-full object-cover object-top transition-opacity duration-[var(--dur-base)] ease-[var(--ease-out)]",
            playing ? "opacity-100" : "opacity-0",
          )}
        >
          {sources.webm && <source src={sources.webm} type="video/webm" />}
          {sources.mp4 && <source src={sources.mp4} type="video/mp4" />}
          {"src" in sources && sources.src && !sources.mp4 && !sources.webm && <source src={sources.src} />}
        </video>
      )}

      {nothing &&
        (fallback ?? (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(80%_70%_at_50%_0%,rgb(201_133_63/.24),transparent_70%),linear-gradient(180deg,#1b1714,#0d0b09)]"
          >
            <span className="font-display text-[clamp(28px,12cqw,64px)] font-black leading-none tracking-[-0.03em] text-copper">
              {initials(project.title)}
            </span>
            {label && project.monitorLabel && (
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-ink max-[899px]:text-[12px]">
                {project.monitorLabel}
              </span>
            )}
          </span>
        ))}
    </span>
  );
}
