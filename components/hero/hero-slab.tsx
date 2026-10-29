"use client";

import type { DemoDecision, ImageRef } from "@/lib/content/types";
import { Screen, TypeText, type ScreenHandle } from "@/components/system";
import { cn } from "@/lib/utils";
import { Storefront } from "./storefront";
import type { OpsDemoState } from "./use-ops-demo";

type HeroSlabProps = {
  state: OpsDemoState;
  decision?: DemoDecision;
  onDecide: (actionIndex: number) => void;
  /** Which build the demo is modelled on. */
  source: string;
  storefront?: ImageRef;
  screenRef?: React.Ref<ScreenHandle>;
  ledRef?: React.Ref<HTMLSpanElement>;
  className?: string;
};

/**
 * The hero object: a thin cream-metal display slab. Upper glass shows the
 * storefront (what customers see); the ink panel below is a working demo of the
 * operations layer: agents prepare decisions, the visitor makes the call.
 */
export function HeroSlab({ state, decision, onDecide, source, storefront, screenRef, ledRef, className }: HeroSlabProps) {
  const resolved = state.phase === "resolved";

  return (
    <div
      className={cn(
        "relative rounded-[clamp(12px,1.8cqw,22px)] p-[clamp(6px,1.1cqw,11px)]",
        "bg-[linear-gradient(155deg,#fdf9f1_0%,var(--color-paper)_38%,#d9ccb4_100%)]",
        "shadow-[inset_0_1px_0_rgb(255_255_255/.95),inset_0_-2px_0_rgb(17_17_17/.08),0_2px_2px_rgb(17_17_17/.08),0_22px_40px_-22px_rgb(17_17_17/.4)]",
        className,
      )}
    >
      {/* status light on the frame's top edge */}
      <span ref={ledRef} aria-hidden="true" className="absolute -top-px right-[7%] h-[3px] w-[5%] rounded-b-sm bg-copper shadow-glow" />

      <div className="@container relative overflow-hidden rounded-[clamp(8px,1cqw,12px)] bg-ink shadow-[inset_0_0_0_1px_rgb(17_17_17/.25)]">
        {/* Website layer: the storefront customers see */}
        <div aria-hidden="true" className="relative aspect-[3.38/1.3]">
          <Storefront image={storefront} />
        </div>

        {/* System + automation layer: the owner's operations panel */}
        <Screen
          ref={screenRef}
          bootOn="manual"
          className="rounded-none border-t-[3px] border-copper bg-[linear-gradient(180deg,#1d1b18,#0c0b0a)] px-[clamp(14px,3.2cqw,28px)] pb-[clamp(14px,2.6cqw,24px)] pt-[clamp(10px,2cqw,18px)]"
        >
          <div className="relative z-[3] flex flex-col gap-[clamp(10px,1.8cqw,16px)]">
            <div className="flex items-center justify-between gap-3 font-mono text-[clamp(9.5px,1.2cqw,11px)] uppercase tracking-[0.12em] text-muted-ink">
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-copper shadow-glow" />
                Live demo · {source}
              </span>
              <span aria-hidden="true" className="hidden tabular-nums min-[420px]:inline">
                Agents {state.handled} · You {state.decided}
              </span>
            </div>

            {decision && (
              <div role="group" aria-label="Decision waiting for you" className="grid">
                {/* waiting: the agent's request */}
                <div
                  inert={resolved}
                  className={cn(
                    "flex flex-col gap-[clamp(6px,1cqw,10px)] transition-[opacity,transform] duration-300 ease-out-expo [grid-area:1/1]",
                    resolved && "pointer-events-none -translate-y-1 opacity-0",
                  )}
                >
                  <span className="font-mono text-[clamp(10px,1.3cqw,12px)] uppercase tracking-[0.12em] text-copper">
                    {decision.agent} · needs you
                  </span>
                  <p className="font-mono text-[clamp(14px,2.6cqw,21px)] leading-snug text-paper">
                    <TypeText key={state.index} text={decision.title} trigger={state.index + 1} speed={22} caret={false} />
                  </p>
                  <p className="text-[clamp(12px,1.7cqw,14.5px)] leading-snug text-muted-ink">{decision.detail}</p>
                  <div className="mt-[clamp(2px,0.6cqw,6px)] flex flex-wrap gap-2">
                    {decision.actions.map((a, i) => (
                      <button
                        key={a.label}
                        type="button"
                        disabled={resolved}
                        onClick={() => onDecide(i)}
                        className={cn(
                          "min-h-11 cursor-pointer rounded-[9px] px-[clamp(14px,2.2cqw,20px)] text-[clamp(13px,1.7cqw,14.5px)] font-semibold transition-[transform,background-color,color] duration-150 active:translate-y-px min-[900px]:min-h-[clamp(36px,4.6cqw,44px)]",
                          a.primary
                            ? "bg-copper text-ink shadow-[inset_0_1px_0_rgb(255_255_255/.25),0_2px_0_#000] hover:bg-[#d5924c]"
                            : "bg-paper/8 text-paper shadow-[inset_0_0_0_1px_rgb(243_234_219/.18)] hover:bg-paper/12",
                        )}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* resolved: the outcome */}
                <p
                  aria-hidden="true"
                  className={cn(
                    "flex items-start gap-3 self-center font-mono text-[clamp(14px,2.4cqw,20px)] leading-snug text-paper transition-[opacity,transform] duration-300 ease-out-expo [grid-area:1/1]",
                    !resolved && "pointer-events-none translate-y-1 opacity-0",
                  )}
                >
                  <span aria-hidden="true" className="text-copper">
                    ✓
                  </span>
                  <span>{state.result}</span>
                </p>
                {/* announce outcomes to screen readers */}
                <p className="sr-only" aria-live="polite">
                  {resolved ? state.result : ""}
                </p>
              </div>
            )}

            {/* routine work agents finished on their own */}
            <ul aria-hidden="true" className="flex flex-col gap-1 border-t border-ink-3 pt-[clamp(8px,1.4cqw,12px)] font-mono text-[clamp(10.5px,1.35cqw,12.5px)] text-muted-ink">
              {state.log.map((l) => (
                <li key={l.id} className="flex animate-[log-in_.5s_var(--ease-out-expo)] items-center gap-2 truncate">
                  <span className="text-copper/80">✓</span>
                  <span className="uppercase tracking-[0.08em] text-muted-ink/80">{l.agent}</span>
                  <span className="truncate text-paper/75">{l.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </Screen>
      </div>
    </div>
  );
}
