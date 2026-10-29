import type { Project } from "@/lib/content/types";
import { ScrollFx } from "@/components/fx/scroll-fx";
import { Band, Label, Panel, SectionHeader } from "@/components/system";

const layerMeta = [
  { key: "website", n: 1, part: "Glass", title: "Website", line: "What customers see" },
  { key: "system", n: 2, part: "Board", title: "System", line: "What the team runs on" },
  { key: "automation", n: 3, part: "Core", title: "Automation", line: "What runs without you" },
] as const;

/**
 * Case study system diagram (DESIGN.md §9.3): the project's three layers,
 * stacked like the slab, with its real features in each. Empty layers are left out.
 */
export function SystemDiagram({ project }: { project: Project }) {
  const layers = layerMeta.filter((l) => project.layers[l.key].length > 0);
  if (layers.length === 0) return null;

  return (
    <Band tone="ink" aria-label="How it's built" className="section-pad">
      <div className="wrap">
        <SectionHeader
          label="System diagram"
          title={
            <>
              How it&apos;s <em>built</em>
            </>
          }
          intro={
            layers.length === 3
              ? "All three layers, designed together."
              : `${layers.map((l) => l.title).join(" and ")}, designed together.`
          }
        />
        {/* Signature: the wire draws down the stack as each layer rises into place. */}
        <ScrollFx as="ol" effects={["draw", "rise"]} className="relative flex flex-col gap-5">
          {/* wire running through the layers */}
          <span
            aria-hidden="true"
            data-fx="line"
            data-fx-axis="y"
            className="absolute bottom-8 left-[27px] top-8 w-px bg-[linear-gradient(180deg,transparent,var(--color-copper)_12%,var(--color-copper)_88%,transparent)] opacity-60 min-[900px]:left-[35px]"
          />
          {layers.map((l) => (
            <li key={l.key} data-fx="item" className="relative">
              <Panel tone="ink" className="grid grid-cols-1 gap-5 py-6 pl-16 pr-6 min-[900px]:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] min-[900px]:items-center min-[900px]:gap-10 min-[900px]:py-8 min-[900px]:pl-20 min-[900px]:pr-8">
                <span
                  aria-hidden="true"
                  className="absolute left-[21px] top-8 grid size-3.5 place-items-center rounded-full bg-ink-3 shadow-[0_0_0_4px_var(--color-ink-2)] min-[900px]:left-[29px] min-[900px]:top-1/2 min-[900px]:-mt-[7px]"
                >
                  <i className="block size-1.5 rounded-full bg-copper" />
                </span>
                <div>
                  <Label>
                    Layer {l.n} · {l.part}
                  </Label>
                  <h3 className="mt-2 font-display text-[clamp(26px,2.6vw,34px)] font-extrabold leading-none tracking-[-0.02em] [font-variation-settings:'wdth'_104]">
                    {l.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-ink">{l.line}</p>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {project.layers[l.key].map((f) => (
                    <li
                      key={f}
                      className="ink-inset rounded-lg px-3 py-2 font-mono text-[12px] tracking-[0.02em] text-paper"
                    >
                      <span aria-hidden="true" className="mr-2 text-copper">
                        ›
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </Panel>
            </li>
          ))}
        </ScrollFx>
      </div>
    </Band>
  );
}
