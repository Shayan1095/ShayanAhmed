import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CaseHero } from "@/components/case-study/case-hero";
import { SystemDiagram } from "@/components/case-study/system-diagram";
import { Testimonials } from "@/components/sections/testimonials";
import { Band, Button, Label, Panel, Rise, SectionHeader, SplitReveal, UiFragment } from "@/components/system";
import { getProjects, getTestimonials } from "@/lib/content";
import { site } from "@/lib/site";

type Params = { slug: string };

async function caseStudies() {
  return (await getProjects()).filter((p) => p.hasCaseStudy);
}

export async function generateStaticParams(): Promise<Params[]> {
  return (await caseStudies()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const project = (await caseStudies()).find((p) => p.slug === slug);
  if (!project) return {};
  const title = `${project.title} case study`;
  return {
    title,
    description: project.summary,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: { type: "article", title: `${title} · ${site.name}`, description: project.summary, url: `/work/${project.slug}` },
  };
}

/**
 * Case study template (DESIGN.md §9). Known slugs are prerendered by
 * generateStaticParams; the Suspense shell keeps navigation instant otherwise.
 */
export default function CaseStudyPage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense fallback={<main id="main" className="min-h-svh" aria-busy="true" />}>
      <CaseStudy params={params} />
    </Suspense>
  );
}

async function CaseStudy({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const all = await caseStudies();
  const index = all.findIndex((p) => p.slug === slug);
  const project = all[index];
  if (!project) notFound();

  const next = all[(index + 1) % all.length];
  const testimonials = (await getTestimonials()).filter((t) => t.projectSlug === project.slug);
  const features = project.features.filter((f) => f.text.trim());
  const agents = project.agents ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    url: `${site.url}/work/${project.slug}`,
    creator: { "@type": "Person", name: site.name, url: site.url },
    ...(project.liveUrl && { sameAs: project.liveUrl }),
  };

  return (
    <main id="main">
      <CaseHero project={project} index={index} total={all.length} />

      {project.problem && (
        <Band aria-label="The problem" className="pb-20 min-[900px]:pb-28">
          <div className="wrap grid grid-cols-1 gap-6 min-[900px]:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] min-[900px]:gap-10">
            <Label className="pt-2">The problem</Label>
            <Rise as="p" className="max-w-[30em] font-display text-[clamp(24px,2.6vw,34px)] font-semibold leading-[1.25] tracking-[-0.01em]">
              {project.problem}
            </Rise>
          </div>
        </Band>
      )}

      <SystemDiagram project={project} />

      {(project.uiFragments.length > 0 || agents.length > 0 || features.length > 0) && (
        <Band aria-label="Inside the system" className="section-pad">
          <div className="wrap">
            <SectionHeader
              label="Inside the system"
              title={
                agents.length > 0 ? (
                  <>
                    {agents.length} agents, <em>one owner.</em>
                  </>
                ) : (
                  <>
                    What it <em>does</em>
                  </>
                )
              }
              intro={
                agents.length > 0
                  ? "Agents prepare the work. The owner approves every action that matters. Statuses are example data."
                  : undefined
              }
            />

            {project.uiFragments.length > 0 && (
              <Rise className="mb-10 flex flex-wrap gap-4">
                {project.uiFragments.map((f, i) => (
                  <UiFragment key={f.text} tag={f.tag} text={f.text} actions={f.actions} live={i === 0} className="w-[280px]" />
                ))}
              </Rise>
            )}

            {agents.length > 0 && (
              <ul className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[1000px]:grid-cols-4">
                {agents.map((a, i) => (
                  <Rise as="li" key={a.name} delay={(i % 4) * 0.05}>
                    <Panel className="flex h-full flex-col gap-3 p-5">
                      <div className="flex items-center justify-between">
                        <Label>Agent {String(i + 1).padStart(2, "0")}</Label>
                        <span
                          aria-hidden="true"
                          className={a.needsYou ? "size-2 rounded-full bg-walnut" : "size-2 rounded-full bg-paper-edge"}
                        />
                      </div>
                      <h3 className="font-display text-lg font-extrabold uppercase leading-tight [font-variation-settings:'wdth'_112]">
                        {a.name}
                      </h3>
                      <p className="mt-auto font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                        {a.needsYou ? "Needs you · " : ""}
                        {a.status}
                      </p>
                    </Panel>
                  </Rise>
                ))}
              </ul>
            )}

            {features.length > 0 && (
              <ul className="mt-10 grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[1000px]:grid-cols-3">
                {features.map((f) => (
                  <Rise as="li" key={f.title}>
                    <Panel className="h-full p-6">
                      <h3 className="type-card text-[22px]">{f.title}</h3>
                      <p className="mt-3 text-[15px] text-muted">{f.text}</p>
                    </Panel>
                  </Rise>
                ))}
              </ul>
            )}
          </div>
        </Band>
      )}

      {project.results && project.results.length > 0 && (
        <Band tone="ink" aria-label="Results" className="section-pad">
          <div className="wrap">
            <SectionHeader label="Results" title={<>What <em>changed</em></>} />
            <dl className="grid grid-cols-1 gap-5 min-[640px]:grid-cols-2 min-[1000px]:grid-cols-3">
              {project.results.map((r) => (
                <Panel key={r.label} tone="ink" className="p-7">
                  <dt>
                    <Label>{r.label}</Label>
                  </dt>
                  <dd className="mt-3 font-display text-[clamp(40px,5vw,64px)] font-extrabold leading-none text-copper [font-variation-settings:'wdth'_118]">
                    {r.value}
                  </dd>
                </Panel>
              ))}
            </dl>
          </div>
        </Band>
      )}

      <Testimonials items={testimonials} />

      {next && next.slug !== project.slug && (
        <Band aria-label="Next project" className="section-pad border-t border-paper-edge">
          <div className="wrap">
            <Link href={`/work/${next.slug}`} className="group block">
              <Label>Next project</Label>
              <SplitReveal
                as="p"
                className="mt-4 font-display text-[clamp(48px,9vw,140px)] font-extrabold uppercase leading-[0.86] tracking-[-0.045em] transition-colors [font-variation-settings:'wdth'_116] group-hover:text-walnut"
              >
                {next.title} →
              </SplitReveal>
              <p className="mt-5 max-w-[36em] text-muted">{next.summary}</p>
            </Link>
          </div>
        </Band>
      )}

      <Band tone="ink" aria-label="Start a project" className="section-pad">
        <div className="wrap flex flex-col items-start gap-8 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
          <div>
            <Label>Your project</Label>
            <p className="mt-4 max-w-[14em] font-display text-[clamp(34px,4.6vw,64px)] font-extrabold uppercase leading-[0.92] tracking-[-0.035em] [font-variation-settings:'wdth'_116]">
              Want this for <em className="font-bold italic text-copper [font-variation-settings:'wdth'_94]">your business?</em>
            </p>
          </div>
          <Button href="/#contact" variant="paper" size="lg" arrow>
            Start a project
          </Button>
        </div>
      </Band>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </main>
  );
}
