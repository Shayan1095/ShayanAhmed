"use client";

import { useRef } from "react";
import { Band, Label, SectionHeader, Screws } from "@/components/system";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { motionGrammar } from "@/lib/motion";

const steps = [
  {
    title: "Discovery call",
    text: "We map what slows your business down and what the site needs to do.",
    get: "A written summary of goals",
  },
  {
    title: "Plan and milestones",
    text: "Scope, timeline and price, split into milestones you approve.",
    get: "A price per milestone",
  },
  {
    title: "Build with weekly demos",
    text: "Real progress on a live link, so you can steer before it's finished.",
    get: "A live link, updated weekly",
  },
  {
    title: "Launch and handover",
    text: "Deployed, documented, and walked through with your team.",
    get: "Docs and a recorded walkthrough",
  },
];

/**
 * 04 Process (ink). Signature motion: scroll scrubs a mixing-desk fader and
 * each step's light comes on as the cap reaches it. Lit by default without JS.
 */
export function Process() {
  const rack = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = rack.current!;
      const fill = el.querySelector("[data-fill]");
      const cap = el.querySelector("[data-cap]");
      const items = gsap.utils.toArray<HTMLElement>("[data-step]", el);
      const light = (p: number) =>
        items.forEach((s, i) => s.toggleAttribute("data-on", p >= i / items.length + 0.02 || (i === 0 && p > 0.01)));

      gsap.matchMedia().add(MQ.motion, () => {
        gsap.set(fill, { width: "0%" });
        gsap.set(cap, { left: "0%" });
        gsap
          .timeline({
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              end: "bottom 45%",
              scrub: motionGrammar.scrub,
              onUpdate: (self) => light(self.progress),
              onRefresh: (self) => light(self.progress),
            },
          })
          .to(fill, { width: "100%", ease: "none" }, 0)
          .to(cap, { left: "100%", ease: "none" }, 0);
        return () => items.forEach((s) => s.setAttribute("data-on", ""));
      });
    },
    { scope: rack },
  );

  return (
    <Band tone="ink" id="process" aria-label="Process" className="section-pad">
      <div className="wrap">
        <SectionHeader
          index="04"
          label="Process"
          title={
            <>
              From first call <em>to handover</em>
            </>
          }
          intro="Milestones you approve, a live link every week, and a clean handover at the end."
        />
        <div
          ref={rack}
          className="relative rounded-[26px] bg-[linear-gradient(180deg,var(--color-ink-2),#161513)] p-[26px] shadow-ink-raised min-[900px]:p-9"
        >
          <Screws tone="ink" />
          <div aria-hidden="true" className="ink-inset relative mx-0 mb-11 mt-4 h-3.5 rounded-lg bg-[#0a0a0a]">
            <div className="absolute inset-x-0 -top-4 flex justify-between">
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} className="block h-2 w-px bg-ink-3" />
              ))}
            </div>
            <div
              data-fill
              className="absolute bottom-1 left-0 top-1 w-full rounded-md bg-[linear-gradient(90deg,rgb(201_133_63/.3),var(--color-copper))] shadow-glow"
            />
            <div
              data-cap
              className="absolute left-full top-1/2 -ml-[22px] -mt-[29px] h-[58px] w-11 rounded-[9px] bg-[linear-gradient(180deg,var(--color-paper-hi),var(--color-paper-lo))] shadow-[0_8px_16px_rgb(0_0_0/.6),inset_0_1px_0_#fff] after:absolute after:inset-x-2 after:top-[27px] after:h-[3px] after:rounded-sm after:bg-ink"
            />
          </div>
          <ol className="grid grid-cols-1 gap-[26px] min-[521px]:grid-cols-2 min-[900px]:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} data-step data-on="" className="group/step flex flex-col gap-2.5">
                <span
                  aria-hidden="true"
                  className="size-3 rounded-full bg-ink-3 shadow-[inset_0_1px_2px_rgb(0_0_0/.8)] transition-[background-color,box-shadow] duration-300 group-data-on/step:bg-copper group-data-on/step:shadow-[0_0_12px_2px_rgb(201_133_63/.75)]"
                />
                <Label>Step {i + 1}</Label>
                <h3 className="font-display text-[21px] font-extrabold uppercase leading-[1.05] [font-variation-settings:'wdth'_112]">
                  {s.title}
                </h3>
                <p className="text-[14.5px] text-muted-ink">{s.text}</p>
                <p className="mt-1 border-t border-dashed border-ink-3 pt-3 text-[13.5px] text-[#d9cfc0]">
                  <Label className="mb-1 block text-[9.5px]">You get</Label>
                  {s.get}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Band>
  );
}
