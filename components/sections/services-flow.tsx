import { Rise, Screen, StatusLight } from "@/components/system";
import { cn } from "@/lib/utils";

const steps = [
  { layer: "Website", title: "Order placed", text: "A customer checks out on the storefront." },
  { layer: "Automation", title: "Risk check", text: "An agent scores the order and flags duplicates." },
  { layer: "System", title: "You approve", text: "One tap from the owner panel.", you: true },
  { layer: "Automation", title: "Dispatched", text: "Courier booked, customer notified." },
] as const;

/**
 * A real workflow from the Brands Attire build, laid out as a calm sequence.
 * The one human step ("You approve") carries the only lit light.
 */
export function ServicesFlow() {
  return (
    <div className="mb-[72px]">
      <ol className="relative grid grid-cols-1 gap-4 min-[900px]:grid-cols-4 min-[900px]:gap-[22px]">
        {/* the route through the four steps */}
        <li
          aria-hidden="true"
          className="pointer-events-none absolute bottom-6 left-[27px] top-6 w-px bg-[linear-gradient(180deg,rgb(201_133_63/.15),rgb(201_133_63/.7),rgb(201_133_63/.15))] min-[900px]:inset-x-[12.5%] min-[900px]:bottom-auto min-[900px]:top-[27px] min-[900px]:h-px min-[900px]:w-auto min-[900px]:bg-[linear-gradient(90deg,rgb(201_133_63/.15),rgb(201_133_63/.7),rgb(201_133_63/.15))]"
        />
        {steps.map((s, i) => (
          <Rise as="li" key={s.title} delay={i * 0.06} className="relative z-[1] flex gap-4 min-[900px]:flex-col min-[900px]:gap-4">
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
          </Rise>
        ))}
      </ol>
      <p className="mt-7 text-[14.5px] text-muted-ink">
        A real flow from the Brands Attire build. Every system I deliver follows this shape: agents prepare, you decide.
      </p>
    </div>
  );
}
