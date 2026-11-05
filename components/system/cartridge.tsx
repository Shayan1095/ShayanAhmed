"use client";

import Link from "next/link";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Screen, type ScreenHandle } from "./screen";
import { StatusBadge, type ProjectStatus } from "./status-badge";

type CartridgeProps = {
  title: string;
  /** Kind label, e.g. "Management system". */
  kind: string;
  status: ProjectStatus;
  summary: string;
  /** One fact on the cartridge's mini label screen. */
  fact: string;
  /** Screenshot or diagram. Without one, the label screen fills the slot. */
  shot?: React.ReactNode;
  href?: string;
  className?: string;
};

/**
 * Archive project card: grip strip, label area, status badge. Lifts slightly on
 * hover; with a screenshot, its mini label screen boots with one fact on hover.
 */
export function Cartridge({ title, kind, status, summary, fact, shot, href, className }: CartridgeProps) {
  const screen = useRef<ScreenHandle>(null);

  const body = (
    <div
      className={cn(
        "group/cart relative flex h-full flex-col rounded-[16px_16px_22px_22px] px-[18px] pb-5",
        "bg-[linear-gradient(180deg,var(--color-paper-hi),var(--color-paper)_50%,var(--color-paper-lo))] shadow-raised",
        "transition-[transform,box-shadow] duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-[var(--shadow-raised),0_22px_30px_-22px_rgb(17_17_17/.35)]",
      )}
    >
      {/* grip strip */}
      <div
        aria-hidden="true"
        className="-mx-[18px] mb-4 h-[26px] rounded-t-[16px] bg-[repeating-linear-gradient(90deg,var(--color-paper-lo)_0_3px,var(--color-paper-hi)_3px_7px)] shadow-[inset_0_-1px_0_var(--color-paper-edge)]"
      />
      <div className="flex flex-1 flex-col gap-2.5 rounded-[10px] bg-paper-hi p-4 shadow-[inset_0_0_0_1px_var(--color-paper-edge)]">
        <div className="inset-track relative h-[126px] overflow-hidden rounded-lg">
          {shot}
          <Screen
            ref={screen}
            // With a screenshot the screen is a hover reveal; without one it is the label screen itself.
            bootOn={shot ? "manual" : "view"}
            className={cn(
              "absolute inset-0 flex flex-col justify-between rounded-lg px-3.5 py-3 font-mono text-[11.5px] tracking-[0.02em]",
              shot &&
                "opacity-0 transition-opacity duration-200 group-hover/cart:opacity-100 [@media(hover:none)]:top-auto [@media(hover:none)]:rounded-t-none [@media(hover:none)]:opacity-100",
            )}
          >
            {!shot && (
              <span aria-hidden="true" className="relative z-[3] flex items-center justify-end">
                <span className="flex gap-1">
                  <i className="block size-1.5 rounded-full bg-ink-3" />
                  <i className="block size-1.5 rounded-full bg-ink-3" />
                </span>
              </span>
            )}
            <span className="relative z-[3] mt-auto">
              <span aria-hidden="true" className="mr-2 text-copper">
                ›
              </span>
              {fact}
            </span>
          </Screen>
        </div>
        <div className="flex items-center justify-between gap-2.5">
          <Label>{kind}</Label>
          <StatusBadge status={status} />
        </div>
        <h3 className="font-display text-xl font-extrabold leading-[1.1] tracking-[-0.01em]">
          {href ? (
            <Link href={href} className="after:absolute after:inset-0 after:content-['']">
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        <p className="text-sm text-muted">{summary}</p>
      </div>
    </div>
  );

  return (
    <div className={cn("h-full", className)} onPointerEnter={() => shot && screen.current?.boot()}>
      {body}
    </div>
  );
}
