"use client";

import type { HeroChannel, ImageRef } from "@/lib/content/types";
import { Screen, TypeText, type ScreenHandle } from "@/components/system";
import { cn } from "@/lib/utils";
import { Storefront } from "./storefront";
import type { Channels, ConsoleLine } from "./use-hero-console";

const tabs: { ch: HeroChannel; label: string }[] = [
  { ch: "site", label: "Site" },
  { ch: "orders", label: "Orders" },
  { ch: "leads", label: "Leads" },
];

type HeroSlabProps = {
  lines: ConsoleLine[];
  channels: Channels;
  onToggle: (ch: HeroChannel) => void;
  mode: string;
  clock: string;
  storefront?: ImageRef;
  stripRef?: React.Ref<ScreenHandle>;
  ledRef?: React.Ref<HTMLSpanElement>;
  className?: string;
};

/**
 * The hero object in HTML: a thin cream-metal display slab. Upper glass shows
 * the storefront (Website); the dark live strip shows the latest event with
 * clickable channel tabs. The 3D slab (step 7) replaces this on capable desktops
 * and keeps it as the fallback.
 */
export function HeroSlab({ lines, channels, onToggle, mode, clock, storefront, stripRef, ledRef, className }: HeroSlabProps) {
  const latest = lines[lines.length - 1];
  const previous = lines.length > 1 ? lines[0] : undefined;

  return (
    <div
      className={cn(
        "relative rounded-[clamp(10px,1.6cqw,22px)] p-[1.1cqw]",
        "bg-[linear-gradient(155deg,#fdf9f1_0%,var(--color-paper)_38%,#d9ccb4_100%)]",
        "shadow-[inset_0_1px_0_rgb(255_255_255/.95),inset_0_-2px_0_rgb(17_17_17/.08),inset_1px_0_0_rgb(255_255_255/.6),0_2px_2px_rgb(17_17_17/.08),0_24px_40px_-18px_rgb(17_17_17/.35),0_60px_90px_-40px_rgb(17_17_17/.35)]",
        className,
      )}
    >
      {/* status light on the frame's top-right edge */}
      <span
        ref={ledRef}
        aria-hidden="true"
        className="absolute -top-px right-[7%] h-[3px] w-[5%] rounded-b-sm bg-copper shadow-glow"
      />
      <div className="@container relative aspect-[3.38/2.08] overflow-hidden rounded-[clamp(6px,0.9cqw,12px)] bg-ink shadow-[inset_0_0_0_1px_rgb(17_17_17/.25)]">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[71%]">
          <Storefront image={storefront} />
        </div>

        <Screen
          ref={stripRef}
          bootOn="manual"
          className="absolute inset-x-0 bottom-0 flex h-[29%] flex-col justify-between rounded-none border-t-[3px] border-copper bg-[linear-gradient(180deg,#1d1b18,#0c0b0a)] px-[4.1cqw] pb-[2.4cqw] pt-[1.8cqw]"
        >
          <div className="relative z-[3] flex items-center justify-between gap-[2cqw]">
            <span aria-hidden="true" className="font-mono text-[1.45cqw] uppercase tracking-[0.1em] text-muted-ink">
              Live · {mode} · {clock}
            </span>
            <div role="group" aria-label="Live channels" className="flex gap-[1cqw]">
              {tabs.map((t) => (
                <button
                  key={t.ch}
                  type="button"
                  aria-pressed={channels[t.ch]}
                  onClick={() => onToggle(t.ch)}
                  className={cn(
                    "min-w-[9cqw] cursor-pointer rounded-[0.7cqw] px-[1.4cqw] py-[0.7cqw] font-mono text-[1.3cqw] font-medium uppercase tracking-[0.08em] transition-colors",
                    "focus-visible:outline-offset-2",
                    channels[t.ch]
                      ? "bg-copper text-ink"
                      : "bg-paper/5 text-muted-ink shadow-[inset_0_0_0_1px_rgb(243_234_219/.2)] hover:text-paper",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div aria-hidden="true" className="relative z-[3] flex flex-col gap-[0.8cqw] font-mono text-[2.35cqw] leading-tight">
            {previous && (
              <p className="truncate text-muted-ink/80">
                <span className="mr-[1.4cqw] font-medium uppercase text-copper/70">{previous.tag}</span>
                {previous.text}
              </p>
            )}
            {latest && (
              <p className="truncate">
                <span className="mr-[1.4cqw] font-medium uppercase text-copper [text-shadow:0_0_14px_rgb(201_133_63/.75)]">
                  {latest.tag}
                </span>
                <TypeText key={latest.id} text={latest.text} trigger={latest.id} speed={26} />
              </p>
            )}
          </div>
        </Screen>
      </div>
    </div>
  );
}
