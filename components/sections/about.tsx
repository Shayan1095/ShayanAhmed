import Image from "next/image";
import type { SiteSettings } from "@/lib/content/types";
import { ScrollFx } from "@/components/fx/scroll-fx";
import { Band, Button, Label, SplitReveal, Typewriter, WipeReveal } from "@/components/system";
import { SpecSheet } from "./spec-sheet";

/**
 * 05 About (cream). Portrait in a raised frame, spec sheet, short story.
 * Signature: the frame drifts and straightens with scroll; the story rises in.
 */
export function About({ settings }: { settings: SiteSettings }) {
  const portrait = settings.portrait;
  return (
    <Band id="about" aria-label="About" className="section-pad">
      <ScrollFx
        effects={["parallax", "rise"]}
        className="wrap grid grid-cols-1 items-center gap-12 min-[980px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] min-[980px]:gap-[72px]"
      >
        <div data-fx-speed="0.45" data-fx-rotate="-5">
          <figure className="relative mx-auto aspect-[4/5] w-full max-w-[260px] -rotate-2 rounded-3xl min-[640px]:max-w-[420px] bg-[linear-gradient(160deg,var(--color-paper-hi),var(--color-paper-lo))] p-4 shadow-raised">
            <span
              aria-hidden="true"
              className="absolute -top-3.5 left-1/2 h-[30px] w-[120px] -ml-[60px] rotate-3 bg-paper/80 shadow-[0_1px_3px_rgb(17_17_17/.2)]"
            />
            {/* The photo is revealed by a wipe the first time it scrolls in. */}
            <WipeReveal className="inset-track relative size-full overflow-hidden rounded-xl">
              {portrait ? (
                <Image
                  src={portrait.src}
                  alt={portrait.alt}
                  fill
                  sizes="(min-width: 980px) 420px, (min-width: 640px) 420px, 260px"
                  className="object-cover"
                />
              ) : (
                // No photo yet: an embossed monogram, not placeholder text.
                <span
                  aria-hidden="true"
                  className="absolute inset-0 grid place-items-center font-display text-[clamp(96px,14vw,168px)] font-black text-paper-lo [text-shadow:0_1px_0_rgb(255_255_255/.8),0_-1px_0_rgb(17_17_17/.12)]"
                >
                  SA
                </span>
              )}
            </WipeReveal>
          </figure>
        </div>
        <div>
          <Label>
            <Typewriter text="05 · About" speed={38} />
          </Label>
          <SplitReveal className="mb-[22px] mt-4 font-display text-[clamp(34px,4.4vw,60px)] font-extrabold uppercase leading-[0.94] tracking-[-0.035em] [&_em]:font-bold [&_em]:text-walnut">
            I build the part of the website <em>that does the work.</em>
          </SplitReveal>
          <p data-fx="item" className="max-w-[34em] text-[17px] leading-[1.7] text-muted">
            I&apos;m Shayan Ahmed, a full-stack developer working with clients in Pakistan and abroad. I focus on what
            most sites leave out: the systems that save an owner hours every week.
          </p>
          <div data-fx="item" className="mb-[30px] mt-7">
            <SpecSheet rows={settings.specSheet} />
          </div>
          <div data-fx="item">
            <Button href="#contact" variant="paper" arrow>
              Work with me
            </Button>
          </div>
        </div>
      </ScrollFx>
    </Band>
  );
}
