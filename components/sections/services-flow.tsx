"use client";

import { useRef } from "react";
import { Screen, StatusLight } from "@/components/system";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { motionGrammar } from "@/lib/motion";

const steps = [
  { layer: "Website", title: "Order placed", text: "A customer checks out on the storefront." },
  { layer: "Automation", title: "Risk check", text: "An agent scores the order and flags duplicates." },
  { layer: "System", title: "You approve", text: "One tap from the owner panel." },
  { layer: "Automation", title: "Dispatched", text: "Courier booked, customer notified." },
] as const;

/**
 * Signature motion for Services: nodes light up one by one as you scroll and a
 * copper signal travels the line. Everything is lit by default (no JS, reduced motion).
 */
export function ServicesFlow() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const nodes = gsap.utils.toArray<HTMLElement>("[data-node]", el);
      const fill = el.querySelector<HTMLElement>("[data-fill]")!;
      const dot = el.querySelector<HTMLElement>("[data-dot]")!;

      const light = (p: number) =>
        nodes.forEach((n, i) => n.toggleAttribute("data-on", p >= (i / (nodes.length - 1)) * 0.92 + 0.02));

      const mm = gsap.matchMedia();
      mm.add(
        { wide: "(min-width: 900px) and (prefers-reduced-motion: no-preference)", narrow: "(max-width: 899px) and (prefers-reduced-motion: no-preference)" },
        (ctx) => {
          const wide = ctx.conditions?.wide;
          const axis = wide ? { fill: "width", dot: "left" } : { fill: "height", dot: "top" };
          gsap.set(fill, { [axis.fill]: "0%" });
          gsap.set(dot, { [axis.dot]: "0%" });
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: el,
              start: "top 78%",
              end: "bottom 40%",
              scrub: motionGrammar.scrub,
              onUpdate: (self) => light(self.progress),
              onRefresh: (self) => light(self.progress),
            },
          });
          tl.to(fill, { [axis.fill]: "100%", ease: "none" }, 0).to(dot, { [axis.dot]: "100%", ease: "none" }, 0);
          return () => nodes.forEach((n) => n.setAttribute("data-on", ""));
        },
      );
      ScrollTrigger.refresh();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="mb-[72px]">
      <ol className="relative grid grid-cols-1 gap-[18px] pl-16 min-[900px]:grid-cols-4 min-[900px]:gap-[22px] min-[900px]:pl-0">
        {/* signal line */}
        <li
          aria-hidden="true"
          className="ink-inset absolute bottom-5 left-11 top-5 w-1 rounded-sm bg-black min-[900px]:inset-x-[12.5%] min-[900px]:bottom-auto min-[900px]:top-[46px] min-[900px]:h-1 min-[900px]:w-auto"
        >
          <div
            data-fill
            className="absolute left-0 top-0 h-full w-full rounded-sm bg-[linear-gradient(90deg,rgb(201_133_63/.3),var(--color-copper))] shadow-glow min-[900px]:h-full"
          />
          <div
            data-dot
            className="absolute -left-[5px] top-full -mt-[7px] size-3.5 rounded-full bg-paper shadow-[0_0_0_3px_var(--color-copper),0_0_14px_3px_rgb(201_133_63/.8)] min-[900px]:-top-[5px] min-[900px]:left-full min-[900px]:mt-0 min-[900px]:-ml-[7px]"
          />
        </li>
        {steps.map((s, i) => (
          <li
            key={s.title}
            data-node
            data-on=""
            className="group/node relative z-[1] -ml-16 flex items-center gap-4 min-[900px]:ml-0 min-[900px]:flex-col min-[900px]:items-start min-[900px]:gap-3.5"
          >
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(180deg,#2a2724,var(--color-ink-2))] shadow-ink-raised min-[900px]:size-[92px] min-[900px]:rounded-[22px]">
              <i className="block size-4 rounded-full bg-ink-3 shadow-[inset_0_1px_2px_rgb(0_0_0/.8)] transition-[background-color,box-shadow] duration-300 group-data-on/node:bg-copper group-data-on/node:shadow-[0_0_16px_4px_rgb(201_133_63/.75)]" />
            </div>
            <Screen className="w-full px-[18px] pb-[18px] pt-4 opacity-55 transition-opacity duration-300 group-data-on/node:opacity-100">
              <div className="relative z-[3]">
                <span className="type-label text-[10px] text-muted-ink">
                  Step {i + 1} · {s.layer}
                </span>
                <h3 className="mb-1.5 mt-2 font-display text-[21px] font-extrabold uppercase leading-[1.05] [font-variation-settings:'wdth'_112]">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-ink">{s.text}</p>
              </div>
            </Screen>
          </li>
        ))}
      </ol>
      <p className="mt-7 flex items-center gap-3 text-[14.5px] text-muted-ink">
        <StatusLight />A real flow from the Brands Attire build. Every system I deliver follows this shape.
      </p>
    </div>
  );
}
