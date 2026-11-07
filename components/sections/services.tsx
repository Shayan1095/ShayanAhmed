import { ScrollFx } from "@/components/fx/scroll-fx";
import { Band, CoverGrid, Label, Panel, Screen, SectionHeader } from "@/components/system";
import { OrderTicket } from "./order-ticket";

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
      <CoverGrid strength={0.5} />
      <div className="wrap relative">
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

        <OrderTicket />

        {/* The three layers: plates that start stacked in depth and separate as you scroll (desktop). */}
        <ScrollFx as="ul" effects={["plates"]} className="grid grid-cols-1 gap-[22px] max-[767px]:hidden min-[980px]:grid-cols-3">
          {layers.map((l) => (
            <li key={l.title} data-fx="item">
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
                <h3 className="font-display text-[clamp(26px,2.5vw,32px)] font-extrabold leading-none tracking-[-0.02em]">
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
            </li>
          ))}
        </ScrollFx>

        {/* Phones: the same three layers as a single-open accordion (native
            <details name>, so the browser keeps one open; no JS needed). */}
        <div className="flex flex-col gap-3 min-[768px]:hidden">
          {layers.map((l, i) => (
            <details key={l.title} name="service-layers" className="layer-acc group/acc rounded-[18px] bg-ink-2 shadow-ink-raised">
              <summary className="flex min-h-16 cursor-pointer list-none items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <Label className="block">
                    Layer {l.n} · {l.part}
                  </Label>
                  <span className="mt-1.5 block font-display text-[24px] font-extrabold leading-none tracking-[-0.02em]">{l.title}</span>
                </span>
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-3/60 text-[20px] leading-none text-copper transition-transform duration-[260ms] ease-out-expo group-open/acc:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="flex flex-col gap-3 px-5 pb-5">
                <p className="text-[16px] text-muted-ink">{l.promise}</p>
                <ul className="flex flex-col gap-1.5 font-mono text-[13px] leading-relaxed">
                  {l.outputs.map((o) => (
                    <li key={o}>
                      <span aria-hidden="true" className="mr-2 text-copper">
                        ›
                      </span>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </div>
    </Band>
  );
}
