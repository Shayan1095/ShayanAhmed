"use client";

import { usePathname } from "next/navigation";
import { Screen, TypeText } from "@/components/system";

/** The 404 screen: a monitor that lost its signal, printing the missing path. */
export function NoSignal() {
  const path = usePathname();
  return (
    <div className="relative rounded-[22px] bg-[linear-gradient(155deg,#fdf9f1_0%,var(--color-paper)_38%,#d9ccb4_100%)] p-3 shadow-raised">
      <span aria-hidden="true" className="absolute -top-px right-[7%] h-[3px] w-[5%] rounded-b-sm bg-ink-3" />
      <Screen bootOn="mount" bootDelay={0.2} className="aspect-[16/10] rounded-[12px]">
        {/* static noise */}
        <div
          aria-hidden="true"
          className="absolute -inset-[10%] opacity-[0.16] mix-blend-screen [animation:noise-shift_.6s_steps(4)_infinite] [background-image:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E&quot;)]"
        />
        <div className="relative z-[3] flex h-full flex-col justify-between p-[clamp(18px,4%,36px)]">
          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-muted-ink">
            <span>Input · SA-01</span>
            <span className="text-copper">No signal</span>
          </div>
          <p
            aria-hidden="true"
            className="font-display text-[clamp(88px,18cqw,200px)] font-black leading-[0.8] tracking-[-0.05em] text-paper/90 [font-variation-settings:'wdth'_125] [text-shadow:0_0_24px_rgb(243_234_219/.25)]"
          >
            404
          </p>
          <div className="flex flex-col gap-1 font-mono text-[clamp(11px,1.6cqw,14px)] leading-relaxed">
            <TypeText as="div" text={`› Lost signal at ${path}`} />
            <TypeText as="div" delay={700} text="› This page moved or never existed." />
          </div>
        </div>
      </Screen>
    </div>
  );
}
