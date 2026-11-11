import { ProcessRuler } from "./process-ruler";
import { PullQuote } from "./pull-quote";
import { CurtainBand } from "@/components/fx/curtain-band";
import type { Testimonial } from "@/lib/content/types";
import { Band, CoverGrid, SectionHeader } from "@/components/system";

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
 * 03 Process, printed on paper (cream inside the dark site, build brief
 * Phase 6), with the curtain on its corners and an optional pull quote. Signature: the ruler (ProcessRuler). Copper
 * ink fills a ruler as you reach each step, and each step inks in from a
 * blueprint. Cards stack as they pass; no pinning.
 */
export function Process({
  index = "03",
  quote,
  children,
}: {
  index?: string;
  /** A client quote, set large as the magazine pull quote. */
  quote?: Testimonial;
  children?: React.ReactNode;
}) {
  return (
    <Band id="process" aria-label="Process" data-paper className="tone-cream section-pad">
      <CurtainBand target="#process" />
      <CoverGrid strength={0.2} />
      <div className="wrap relative">
        <SectionHeader
          index={index}
          label="Process"
          title={
            <>
              From first call <em>to handover</em>
            </>
          }
          intro="Milestones you approve, a live link every week, and a clean handover at the end."
        />
        <ProcessRuler steps={steps} />
        {quote && <PullQuote item={quote} />}
        {/* Phones: the strip is hidden (the menu carries Start), so no empty gap here. */}
        {children && <div className="mt-12 max-[767px]:hidden">{children}</div>}
      </div>
    </Band>
  );
}
