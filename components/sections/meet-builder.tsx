"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ImageRef, UiFragmentData } from "@/lib/content/types";
import { Band, CoverGrid, Label, SectionHeader, UiFragment } from "@/components/system";
import { cn } from "@/lib/utils";

export type IntroVideo = { src: string; poster?: string; captions?: string };

/**
 * "Meet the builder" (motion spec, Phase 4: the Proof section after the hero).
 * A framed talking-head video: muted, looping and captioned as a preview,
 * loaded only when it comes near the screen; "Tap for sound" restarts it with
 * sound and controls. Until the video is added in the admin, a calm framed
 * card stands in (never an empty frame). Under it, three agent alerts from
 * the Brands Attire build arrive one by one; the panel opens that case study.
 */
export function MeetBuilder({
  index,
  video,
  alerts,
  caseHref,
  portrait,
}: {
  /** Chapter number from the page's one ordered list. */
  index?: string;
  video?: IntroVideo;
  alerts: UiFragmentData[];
  caseHref?: string;
  /** Shown when there is no intro video yet (Admin → Settings). */
  portrait?: ImageRef;
}) {
  const root = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [sound, setSound] = useState(false);
  // Alerts: hidden once JS is ready (armed), then play once on first view.
  const [armed, setArmed] = useState(false);
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setNear(true);
        setInView(e.intersectionRatio > 0.35);
      },
      { rootMargin: "400px 0px", threshold: [0, 0.35] },
    );
    io.observe(el);
    // The alerts play once their own list is a third on screen.
    const listIo = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setPlayed(true);
        listIo.disconnect();
      },
      { threshold: 0.3 },
    );
    if (list.current) listIo.observe(list.current);
    const raf = requestAnimationFrame(() => setArmed(true));
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      listIo.disconnect();
    };
  }, []);

  // The muted preview plays only while it is on screen.
  useEffect(() => {
    const v = player.current;
    if (!v || sound) return;
    if (inView && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) void v.play().catch(() => {});
    else v.pause();
  }, [inView, near, sound]);

  const withSound = () => {
    const v = player.current;
    if (!v) return;
    v.muted = false;
    v.currentTime = 0;
    v.loop = false;
    v.controls = true;
    setSound(true);
    void v.play().catch(() => {});
  };

  return (
    <Band tone="ink" id="builder" aria-labelledby="builder-title" className="section-pad">
      <CoverGrid strength={0.45} />
      <div ref={root} className="wrap relative">
        <SectionHeader
          index={index}
          label="Meet the builder"
          titleId="builder-title"
          title={<>The person behind <em>the systems.</em></>}
          intro={video ? "A short look at how I work, and what an agent hands you each morning." : "What an agent hands you each morning."}
          className="max-[767px]:[&>p]:hidden"
        />

        {/* The video when there is one; else the portrait; else the agent feed
            leads on its own. Never an empty frame or placeholder text. */}
        <div
          className={cn(
            "grid grid-cols-1 items-start gap-8",
            video || portrait ? "min-[980px]:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]" : "max-w-[640px]",
          )}
        >
          {video ? (
            <figure className="relative overflow-hidden rounded-[22px] bg-[#0d0b09] p-2 shadow-[inset_0_1px_0_rgb(255_255_255/.08),0_0_0_1px_rgb(232_178_122/.18),0_30px_60px_-30px_rgb(0_0_0/.9)]">
              <div className="relative aspect-video overflow-hidden rounded-[16px] bg-[radial-gradient(70%_80%_at_50%_0%,rgb(201_133_63/.2),transparent_70%),linear-gradient(180deg,#1b1714,#0d0b09)]">
                <video
                  ref={player}
                  src={near ? video.src : undefined}
                  poster={video.poster}
                  muted={!sound}
                  loop={!sound}
                  playsInline
                  preload="none"
                  className="absolute inset-0 size-full object-cover"
                  aria-label="Intro video from Shayan Ahmed"
                >
                  {video.captions && <track kind="captions" src={video.captions} srcLang="en" label="English" default />}
                </video>
                {!sound && (
                  <button
                    type="button"
                    onClick={withSound}
                    className="absolute bottom-4 left-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f3eadb] px-4 text-[15px] font-bold text-[#140d08] shadow-[0_8px_20px_-8px_rgb(0_0_0/.7)] transition-transform duration-[120ms] active:scale-[0.97]"
                  >
                    <span aria-hidden="true">▶</span> Tap for sound
                  </button>
                )}
              </div>
            </figure>
          ) : portrait ? (
            <figure className="relative mx-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-[22px] shadow-[0_0_0_1px_rgb(232_178_122/.18),0_30px_60px_-30px_rgb(0_0_0/.9)]">
              <Image src={portrait.src} alt={portrait.alt} fill sizes="(min-width: 980px) 420px, 90vw" className="object-cover" />
            </figure>
          ) : null}

          {/* What an agent hands you: three alerts, one after another. */}
          <div className="flex flex-col gap-3">
            <Label accent>This morning, from the agents</Label>
            <ul ref={list} className={cn("flex flex-col gap-3", armed && "alerts-armed", played && "alerts-play")}>
              {alerts.slice(0, 3).map((a, i) => (
                <li key={a.text} className={cn("alert-in", i === 2 && "max-[979px]:hidden")} style={{ "--i": i } as React.CSSProperties}>
                  <UiFragment tag={a.tag} text={a.text} actions={a.actions} live={i === 0} className="w-full" />
                </li>
              ))}
            </ul>
            {caseHref && (
              <Link href={caseHref} className="mt-2 inline-flex min-h-11 items-center gap-2 text-[16px] font-semibold text-copper">
                See the Brands Attire build <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Band>
  );
}
