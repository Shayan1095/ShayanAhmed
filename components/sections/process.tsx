import { ProcessRuler } from "./process-ruler";
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
 * 04 Process (espresso surface). Signature: the ruler (ProcessRuler). Copper
 * ink fills a ruler as you reach each step, and each step inks in from a
 * blueprint. Cards stack as they pass; no pinning.
 */
export function Process({ children }: { children?: React.ReactNode }) {
  return (
    <Band id="process" aria-label="Process" className="section-pad">
      <CoverGrid strength={0.35} />
      <div className="wrap relative">
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
        <ProcessRuler steps={steps} />
        {children && <div className="mt-12">{children}</div>}
      </div>
    </Band>
  );
}
