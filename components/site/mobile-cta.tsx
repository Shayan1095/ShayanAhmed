"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Sticky "Start a project" bar on phones. Appears once the hero is out of view
 * and steps aside while the contact form or footer is on screen.
 */
export function RouteMobileCta() {
  return <MobileCta onHome={usePathname() === "/"} />;
}

export function MobileCta({ onHome }: { onHome: boolean }) {
  const [heroGone, setHeroGone] = useState(!onHome);
  const [contactInView, setContactInView] = useState(false);

  useEffect(() => {
    const watch: IntersectionObserver[] = [];
    const hero = document.getElementById("hero");
    if (hero) {
      const io = new IntersectionObserver(([e]) => setHeroGone(!e.isIntersecting), { rootMargin: "-40% 0px 0px 0px" });
      io.observe(hero);
      watch.push(io);
    }
    const targets = [document.getElementById("contact"), document.querySelector("footer")].filter(Boolean) as Element[];
    const seen = new Set<Element>();
    const io2 = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) seen.add(e.target);
        else seen.delete(e.target);
      }
      setContactInView(seen.size > 0);
    });
    targets.forEach((t) => io2.observe(t));
    watch.push(io2);
    return () => watch.forEach((w) => w.disconnect());
  }, [onHome]);

  const show = heroGone && !contactInView;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-60 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] transition-[transform,opacity] duration-500 ease-out-expo min-[900px]:hidden",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[120%] opacity-0",
      )}
      inert={!show}
    >
      <a
        href={onHome ? "#contact" : "/#contact"}
        className="flex min-h-14 items-center justify-between gap-3 rounded-card bg-[linear-gradient(180deg,var(--ink-key-top,#2a2826),var(--ink-key-bottom,var(--color-ink)))] px-5 text-paper shadow-[inset_0_1px_0_rgb(255_255_255/.14),0_14px_28px_-12px_rgb(17_17_17/.7)]"
      >
        <span className="min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.1em] opacity-75">Reply within a day</span>
        <span className="shrink-0 whitespace-nowrap text-[16px] font-semibold">Start a project →</span>
      </a>
    </div>
  );
}
