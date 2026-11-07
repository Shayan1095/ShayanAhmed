import type { Metadata } from "next";
import Link from "next/link";
import { Archive } from "@/components/sections/archive";
import { CtaStrip } from "@/components/site/cta-strip";
import { Band, Label, Panel, Rise, SplitReveal, StatusBadge, Tag } from "@/components/system";
import { getArchiveProjects, getFeaturedProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Case studies and builds by Shayan Ahmed: storefronts, management systems and automations for clients in Pakistan and abroad.",
  alternates: { canonical: "/work" },
};

/** All work: case studies first, then the full archive with its filter. */
export default async function WorkIndexPage() {
  const [featured, archive] = await Promise.all([getFeaturedProjects(), getArchiveProjects()]);

  return (
    <main id="main">
      <Band className="pb-14 pt-[calc(env(safe-area-inset-top)+128px)]">
        <div className="wrap">
          <Label>Work</Label>
          <SplitReveal
            as="h1"
            start="top bottom"
            className="mt-4 max-w-[14em] font-display text-[clamp(44px,6.4vw,96px)] font-extrabold uppercase leading-[0.88] tracking-[-0.04em]"
          >
            Builds that <em className="font-bold text-walnut">run businesses.</em>
          </SplitReveal>
          <p className="mt-6 max-w-[34em] text-lg text-muted">
            Storefronts, management systems and automations. Case studies first, then everything else.
          </p>

          <ul className="mt-14 grid grid-cols-1 gap-6 min-[900px]:grid-cols-2">
            {featured
              .filter((p) => p.hasCaseStudy)
              .map((p) => (
                <Rise as="li" key={p.slug}>
                  <Link href={`/work/${p.slug}`} className="group block h-full">
                    <Panel className="flex h-full flex-col gap-4 p-7 transition-transform duration-300 ease-out-expo group-hover:-translate-y-1">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={p.status}>{p.statusLabel}</StatusBadge>
                        <Tag>{p.kind}</Tag>
                      </div>
                      <h2 className="font-display text-[clamp(28px,3vw,40px)] font-extrabold leading-none tracking-[-0.03em]">
                        {p.title}
                      </h2>
                      <p className="text-[15.5px] text-muted">{p.summary}</p>
                      <span className="mt-auto inline-flex items-center gap-2 pt-2 text-[15px] font-semibold">
                        Read the case study
                        <span aria-hidden="true" className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1">
                          →
                        </span>
                      </span>
                    </Panel>
                  </Link>
                </Rise>
              ))}
          </ul>
        </div>
      </Band>

      <Archive projects={archive} index="02" className="pb-16 pt-6" codeStart={featured.length + 1} />

      <Band aria-label="Start a project" className="pb-24">
        <div className="wrap">
          <CtaStrip title="Want a system like these for your business?" />
        </div>
      </Band>
    </main>
  );
}
