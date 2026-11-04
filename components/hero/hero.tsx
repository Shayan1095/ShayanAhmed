import { cacheLife } from "next/cache";
import { ArrowRight } from "lucide-react";
import { BuiltInIndex } from "./built-in-index";
import { CoverGrid } from "@/components/system/cover-grid";
import { COVER, FOIL, GLOW, HERO_COPY } from "./hero-data";

/** The cover's issue date, kept current (refreshed daily). */
async function issueDate() {
  "use cache";
  cacheLife("days");
  return new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "Asia/Karachi" }).toUpperCase();
}

/**
 * Hero "The Build" (HERO_BUILD_BRIEF.md, hero-reference.html): a magazine
 * cover. Issue line, the "THE BUILD" masthead in copper foil, the cover
 * story (the page's h1) and the Built-in index. Server-rendered; only the
 * index is a client component. The site navbar floats above it unchanged.
 */
export async function Hero({ caseStudyHref }: { caseStudyHref?: string }) {
  const date = await issueDate();
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden"
      style={{ backgroundColor: COVER.ink, color: COVER.paper }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={GLOW} />
      <CoverGrid />

      {/* Top padding clears the floating navbar; svh keeps phone browser bars from cutting it off. */}
      <div className="relative mx-auto flex min-h-svh max-w-[1360px] flex-col px-4 pb-11 pt-[calc(env(safe-area-inset-top)+96px)] min-[560px]:px-8 min-[900px]:pt-[calc(env(safe-area-inset-top)+100px)]">
        {/* Issue line */}
        <p
          className="m-0 flex flex-wrap justify-between gap-x-4 gap-y-1 pb-2.5 font-mono text-[11px] uppercase tracking-[0.14em]"
          style={{ color: COVER.muted2, borderBottom: "1px solid rgba(232,178,122,.3)" }}
        >
          <span>No. 01 — {date}</span>
          <span>{HERO_COPY.issueMiddle}</span>
          <span>{HERO_COPY.issueRight}</span>
        </p>

        {/* Masthead: decorative; the h1 below carries the meaning. */}
        <p
          aria-hidden="true"
          className="m-0 mt-2.5 whitespace-nowrap text-center font-[family-name:var(--font-archivo)] font-black uppercase"
          style={{
            ...FOIL,
            fontStretch: "62%",
            fontVariationSettings: "'wdth' 62",
            fontSize: "clamp(88px, 23.5vw, 340px)",
            lineHeight: 0.8,
            letterSpacing: "-0.03em",
          }}
        >
          {HERO_COPY.masthead}
        </p>

        {/* Credit line */}
        <p className="m-0 mt-2.5 flex flex-wrap justify-between gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: COVER.copper }}>
          <span>{HERO_COPY.creditLeft}</span>
          <span>{HERO_COPY.creditRight}</span>
        </p>

        {/* Lower row: the cover story and the Built-in index */}
        <div className="flex flex-1 flex-wrap items-end justify-between gap-12 pt-11">
          <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-[26px]">
            <p className="m-0 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: COVER.copper }}>
              <span aria-hidden="true" className="h-px w-7" style={{ background: COVER.copper }} />
              {HERO_COPY.eyebrow}
            </p>
            <h1
              id="hero-title"
              className="m-0 font-[family-name:var(--font-instrument)] font-normal"
              // Normal wrapping (not the site-wide balance), so it breaks as in the reference: "…the systems / built in."
              style={{ fontSize: "clamp(52px, 6.8vw, 104px)", lineHeight: 0.95, letterSpacing: "-0.02em", textWrap: "wrap" }}
            >
              Websites with the systems{" "}
              <em className="pr-[0.06em]" style={FOIL}>
                built in.
              </em>
            </h1>
            <p className="m-0 max-w-[560px] text-[17px] leading-[1.65]" style={{ color: COVER.muted }}>
              I&apos;m{" "}
              <strong className="font-semibold" style={{ color: COVER.paper }}>
                Shayan Ahmed
              </strong>
              . I build the storefront your customers use and the back office that runs it, with agents that take the routine work off your plate while you
              approve every decision.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#contact"
                className="group inline-flex min-h-[54px] items-center gap-2.5 rounded-[4px] px-[26px] text-[16px] font-bold transition-[transform,box-shadow] duration-150 hover:-translate-y-px active:translate-y-[3px] active:shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_1px_0_#6B3F22]"
                style={{
                  color: COVER.onCopper,
                  background: "linear-gradient(180deg, #F2CC9C 0%, #D49A62 55%, #B8763F 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.55), 0 4px 0 #6B3F22, 0 14px 30px rgba(214,140,76,.22)",
                }}
              >
                {HERO_COPY.primaryCta}
                <ArrowRight aria-hidden="true" className="size-[18px] transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
              <a
                href={caseStudyHref ?? "#work"}
                className="inline-flex min-h-[54px] items-center rounded-[4px] px-6 text-[16px] font-semibold transition-colors hover:text-[#E8B27A]"
                style={{ color: COVER.paper, background: "rgba(18,12,8,.5)", boxShadow: "inset 0 0 0 1px rgba(243,234,219,.4)" }}
              >
                {HERO_COPY.secondaryCta}
              </a>
            </div>
          </div>

          <BuiltInIndex />
        </div>
      </div>
    </section>
  );
}
