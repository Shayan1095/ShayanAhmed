import { ArrowRight } from "lucide-react";
import { BuiltInIndex } from "./built-in-index";
import { HeroEntrance } from "./hero-entrance";
import { CoverGrid } from "@/components/system/cover-grid";
import { COVER, FOIL, GLOW, HERO_COPY } from "./hero-data";
import { issueDate } from "@/lib/issue-date";

/** Hero reveal after the intro's split (preloader/intro.css): delay per element. */
const rv = (ms: number) => ({ "data-intro-rv": "", style: { "--d": `${ms}ms` } as React.CSSProperties });

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
      id="hero"
      aria-labelledby="hero-title"
      className="relative overflow-hidden"
      style={{ backgroundColor: COVER.ink, color: COVER.paper }}
    >
      {/* The copper glow drifts slowly on its own (never follows the cursor). */}
      <div aria-hidden="true" className="hero-glow pointer-events-none absolute -inset-[6%]" style={GLOW} />
      <CoverGrid />

      {/* Top padding clears the floating navbar; svh keeps phone browser bars from cutting it off. */}
      <div className="relative mx-auto flex min-h-svh max-w-[1360px] flex-col px-4 pb-11 pt-[calc(env(safe-area-inset-top)+96px)] min-[560px]:px-8 min-[900px]:pt-[calc(env(safe-area-inset-top)+100px)]">
        {/* Issue line */}
        {/* Its hairline is where the intro's line lands (data-hero-rule, preloader.tsx). */}
        <p
          data-hero-rule=""
          className="m-0 flex flex-wrap justify-between gap-x-4 gap-y-1 pb-2.5 font-mono text-[11px] uppercase tracking-[0.14em]"
          style={{ color: COVER.muted2, borderBottom: "1px solid rgba(232,178,122,.3)" }}
        >
          <span>No. 01 — {date}</span>
          {/* Phones: just the issue number and date, on one line. */}
          <span className="max-[699px]:hidden">{HERO_COPY.issueMiddle}</span>
          <span className="max-[699px]:hidden">{HERO_COPY.issueRight}</span>
        </p>

        {/* Masthead: decorative; the h1 below carries the meaning. Each letter is
            its own box so the entrance can raise them one by one (hero-entrance.tsx). */}
        <p
          aria-hidden="true"
          data-hero-masthead=""
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
          {Array.from(HERO_COPY.masthead).map((c, i) =>
            c === " " ? (
              " "
            ) : (
              <span key={i} data-l="" className="inline-block">
                {c}
              </span>
            ),
          )}
        </p>

        {/* Credit line */}
        <p
          data-intro-rv=""
          className="m-0 mt-2.5 flex flex-wrap justify-between gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em]"
          style={{ ...rv(100).style, color: COVER.copper }}
        >
          {/* Phones: just what's built (the name is in the bar and the copy). */}
          <span className="max-[699px]:hidden">{HERO_COPY.creditLeft}</span>
          <span className="max-[699px]:tracking-[0.1em]">{HERO_COPY.creditRight}</span>
        </p>

        {/* Lower row: the cover story and the Built-in index. Side by side, the index's copper rule lines up with the top of the headline (44px = eyebrow + gap). */}
        <div className="mt-auto flex flex-wrap items-start justify-between gap-9 pt-8 min-[900px]:gap-12 min-[900px]:pt-11">
          <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-[26px]">
            <p
              {...rv(140)}
              className="m-0 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em]"
              style={{ ...rv(140).style, color: COVER.copper }}
            >
              <span aria-hidden="true" className="h-px w-7" style={{ background: COVER.copper }} />
              {HERO_COPY.eyebrow}
            </p>
            <h1
              id="hero-title"
              className="m-0 font-[family-name:var(--font-archivo)] font-extrabold"
              // Heavy and a touch condensed; normal wrapping (not the site-wide balance), so it breaks "…the systems / built in."
              style={{
                fontSize: "clamp(46px, 6vw, 92px)",
                fontStretch: "75%",
                fontVariationSettings: "'wdth' 75",
                lineHeight: 0.94,
                letterSpacing: "-0.025em",
                textWrap: "wrap",
              }}
            >
              Websites with the systems{" "}
              {/* One copper sweep crosses it as the hero settles (globals.css .hero-sweep). */}
              <em data-hero-sweep="" className="hero-sweep not-italic">
                built in.
              </em>
            </h1>
            <p
              {...rv(200)}
              className="m-0 max-w-[58ch] text-[17px] leading-[1.65] min-[900px]:text-[18px]"
              style={{ ...rv(200).style, color: COVER.muted }}
            >
              I&apos;m{" "}
              <strong className="font-semibold" style={{ color: COVER.paper }}>
                Shayan Ahmed
              </strong>
              . I build the storefront your customers use and the back office that runs it, with agents that take the routine work off your plate while you
              approve every decision.
            </p>
            <div data-hero-cta="" className="flex flex-wrap gap-3">
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

          <div {...rv(220)} className="flex flex-[1_1_340px] max-w-[420px] min-[1056px]:mt-[44px]">
            <BuiltInIndex />
          </div>
        </div>
      </div>
      <HeroEntrance />
    </section>
  );
}
