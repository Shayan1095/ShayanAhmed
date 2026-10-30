import { ScrollFx } from "@/components/fx/scroll-fx";
import { Screen, StatusLight } from "@/components/system";
import { cn } from "@/lib/utils";

const steps = [
  { layer: "Website", title: "Order placed", text: "A customer checks out on the storefront." },
  { layer: "Automation", title: "Risk check", text: "An agent scores the order and flags duplicates." },
  { layer: "System", title: "You approve", text: "One tap from the owner panel.", you: true },
  { layer: "Automation", title: "Dispatched", text: "Courier booked, customer notified." },
] as const;

/** Signal routes between the steps: gentle arcs, like a trace on a board. */
const ROUTE_H = "M0,8 Q50,0 100,8 T200,8 T300,8";
const ROUTE_V = "M8,0 Q0,16.7 8,33.3 T8,66.6 T8,100";

/**
 * A real workflow from the Brands Attire build, laid out as a calm sequence.
 * The one human step ("You approve") carries the only lit light.
 */
export function ServicesFlow() {
  return (
    <div className="mb-[72px]">
      {/* Signature: the route draws itself across the steps as you scroll; the steps rise along it. */}
      <ScrollFx as="ol" effects={["stroke", "rise"]} className="relative grid grid-cols-1 gap-4 min-[900px]:grid-cols-4 min-[900px]:gap-[22px]">
        {/* The route: a faint track, and a copper signal that draws along it (DrawSVG). */}
        <li aria-hidden="true" className="pointer-events-none absolute bottom-6 left-[19px] top-6 w-4 min-[900px]:hidden">
          <svg viewBox="0 0 16 100" preserveAspectRatio="none" className="size-full overflow-visible">
            <path d={ROUTE_V} fill="none" stroke="var(--color-ink-3)" strokeWidth="1" />
            <path data-fx="stroke" d={ROUTE_V} fill="none" stroke="var(--color-copper)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </li>
        <li aria-hidden="true" className="pointer-events-none absolute inset-x-[12.5%] top-[19px] hidden h-4 min-[900px]:block">
          <svg viewBox="0 0 300 16" preserveAspectRatio="none" className="size-full overflow-visible">
            <path d={ROUTE_H} fill="none" stroke="var(--color-ink-3)" strokeWidth="1" />
            <path data-fx="stroke" d={ROUTE_H} fill="none" stroke="var(--color-copper)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </li>
        {steps.map((s, i) => (
          <li key={s.title} data-fx="item" className="relative z-[1] flex gap-4 min-[900px]:flex-col min-[900px]:gap-4">
            <div
              className={cn(
                "grid size-14 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(180deg,#2a2724,var(--color-ink-2))] font-mono text-sm text-muted-ink shadow-ink-raised",
                "you" in s && "text-paper",
              )}
            >
              {"you" in s ? <StatusLight size="lg" pulse={false} /> : String(i + 1).padStart(2, "0")}
            </div>
            <Screen className="w-full flex-1 px-[18px] pb-[18px] pt-4">
              <div className="relative z-[3]">
                <span className="type-label text-[10px] text-muted-ink">{s.layer}</span>
                <h3 className="mb-1.5 mt-2 font-display text-[21px] font-extrabold leading-[1.05] [font-variation-settings:'wdth'_104]">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-ink">{s.text}</p>
              </div>
            </Screen>
          </li>
        ))}
      </ScrollFx>
      <p className="mt-7 text-[14.5px] text-muted-ink">
        A real flow from the Brands Attire build. Every system I deliver follows this shape: agents prepare, you decide.
      </p>
    </div>
  );
}
