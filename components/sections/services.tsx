import { Band, Label, Panel, Rise, Screen, SectionHeader } from "@/components/system";
import { ServicesFlow } from "./services-flow";

const layers = [
  {
    n: 1,
    part: "Glass",
    title: "Website",
    promise: "Fast, well-built sites that explain what you sell and turn visitors into enquiries.",
    outputs: ["Agency and business sites", "E-commerce storefronts", "Landing pages that convert"],
  },
  {
    n: 2,
    part: "Board",
    title: "System",
    promise: "Dashboards, roles and records your team works from every day.",
    outputs: ["School and restaurant systems", "Subscriber billing", "Admin panels"],
  },
  {
    n: 3,
    part: "Core",
    title: "Automation",
    promise: "Agents and workflows that take repetitive work off your plate.",
    outputs: ["Operations agents", "Lead capture and follow-ups", "Email campaign automation"],
  },
];

/** 02 Services (ink): the three layers every build ships with. */
export function Services() {
  return (
    <Band tone="ink" id="services" aria-labelledby="services-title" className="section-pad">
      <div className="wrap">
        <SectionHeader
          index="02"
          label="Services"
          title={
            <span id="services-title">
              Three layers. <em>One build.</em>
            </span>
          }
          intro="The system runs the routine work. You stay in control of every decision that matters."
        />

        <ServicesFlow />

        <ul className="grid grid-cols-1 gap-[22px] min-[980px]:grid-cols-3">
          {layers.map((l, i) => (
            <Rise as="li" key={l.title} delay={i * 0.08}>
              <Panel tone="ink" as="article" className="group/layer flex h-full flex-col gap-4 px-7 py-[30px]">
                <div className="flex items-center justify-between">
                  <Label>
                    Layer {l.n} · {l.part}
                  </Label>
                  {/* Off at rest; lights on hover so only one light is lit per view. */}
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full bg-ink-3 shadow-[inset_0_1px_2px_rgb(0_0_0/.8)] transition-[background-color,box-shadow] duration-300 group-hover/layer:bg-copper group-hover/layer:shadow-glow"
                  />
                </div>
                <h3 className="font-display text-[clamp(26px,2.5vw,32px)] font-extrabold leading-none tracking-[-0.02em] [font-variation-settings:'wdth'_104]">
                  {l.title}
                </h3>
                <p className="text-[15.5px] text-muted-ink">{l.promise}</p>
                <Screen className="mt-auto px-4 py-3.5">
                  <ul className="relative z-[3] font-mono text-xs leading-loose">
                    {l.outputs.map((o) => (
                      <li key={o}>
                        <span aria-hidden="true" className="mr-2 text-copper">
                          ›
                        </span>
                        {o}
                      </li>
                    ))}
                  </ul>
                </Screen>
              </Panel>
            </Rise>
          ))}
        </ul>
      </div>
    </Band>
  );
}
