import { ScrollFx } from "@/components/fx/scroll-fx";
import { Band, Label, SectionHeader, Screws } from "@/components/system";

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
 * 04 Process (ink): four steps on a rack panel. Signature: a copper progress
 * rail fills with scroll and each step lights as it is reached.
 */
export function Process({ children }: { children?: React.ReactNode }) {
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
        <ScrollFx
          effects={["draw", "rise", "progress"]}
          className="relative rounded-[26px] bg-[linear-gradient(180deg,var(--color-ink-2),#161513)] p-[26px] shadow-ink-raised min-[900px]:p-9"
        >
          <Screws tone="ink" />
          {/* progress rail */}
          <div aria-hidden="true" className="ink-inset relative mb-9 h-1.5 overflow-hidden rounded-full bg-[#0a0a0a]">
            <span
              data-fx="line"
              className="absolute inset-0 block rounded-full bg-[linear-gradient(90deg,rgb(201_133_63/.35),var(--color-copper))] shadow-glow"
            />
          </div>
          <ol className="grid grid-cols-1 gap-8 min-[521px]:grid-cols-2 min-[900px]:grid-cols-4 min-[900px]:gap-[26px]">
            {steps.map((s, i) => (
              <li
                key={s.title}
                data-fx="item"
                data-fx-step
                data-on=""
                className="group/step flex flex-col gap-2.5 min-[900px]:border-l min-[900px]:border-ink-3 min-[900px]:pl-6 min-[900px]:first:border-0 min-[900px]:first:pl-0"
              >
                <span className="font-display text-[34px] font-extrabold leading-none text-ink-3 transition-colors duration-500 [font-variation-settings:'wdth'_110] group-data-on/step:text-copper">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-[21px] font-extrabold leading-[1.1] [font-variation-settings:'wdth'_104]">
                  {s.title}
                </h3>
                <p className="text-[14.5px] text-muted-ink">{s.text}</p>
                <p className="mt-auto border-t border-dashed border-ink-3 pt-3 text-[13.5px] text-[#d9cfc0]">
                  <Label className="mb-1 block text-[9.5px]">You get</Label>
                  {s.get}
                </p>
              </li>
            ))}
          </ol>
        </ScrollFx>
        {children && <div className="mt-10">{children}</div>}
      </div>
    </Band>
  );
}
