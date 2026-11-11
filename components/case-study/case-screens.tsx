import Image from "next/image";
import type { ProjectScreen } from "@/lib/content/types";
import { Band, SectionHeader } from "@/components/system";

/**
 * Screens (build brief, Phase 3): the project's captioned screenshots from the
 * admin, each tagged with the side it shows. Fixed 16:10 frames (the
 * screenshots are 2880×1800), so nothing shifts as they load. Renders nothing
 * without screens.
 */
export function CaseScreens({ screens, title }: { screens?: ProjectScreen[]; title: string }) {
  if (!screens?.length) return null;
  return (
    <Band aria-labelledby="case-screens-title" className="section-pad">
      <div className="wrap">
        <SectionHeader titleId="case-screens-title" label="Screens" title={<>How it <em>looks.</em></>} />
        <ul className="grid grid-cols-1 gap-8 min-[900px]:grid-cols-2 min-[900px]:gap-x-6 min-[900px]:gap-y-12">
          {screens.map((s, i) => (
            <li key={`${s.image.src}-${i}`}>
              <figure className="m-0 flex flex-col gap-3">
                <span className="relative block aspect-[16/10] overflow-hidden rounded-[18px] bg-ink shadow-[0_0_0_1px_rgb(232_178_122/.14),0_24px_48px_-28px_rgb(0_0_0/.9)]">
                  <Image
                    src={s.image.src}
                    alt={s.image.alt || `${title}: ${s.caption}`}
                    fill
                    sizes="(min-width: 900px) 45vw, 92vw"
                    className="object-cover object-top"
                  />
                </span>
                <figcaption className="flex items-baseline gap-3">
                  <span className="type-label shrink-0 text-copper">{s.view === "owner" ? "Owner view" : "Customer view"}</span>
                  <span className="text-[15.5px] text-muted">{s.caption}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </Band>
  );
}
