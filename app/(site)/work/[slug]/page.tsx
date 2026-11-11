import type { Metadata } from "next";
import Link from "next/link";
import { ResponsiveMorph } from "@/components/site/responsive-morph";
import { ProjectTile } from "@/components/site/project-tile";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CaseHero } from "@/components/case-study/case-hero";
import { BandTransitions } from "@/components/fx/band-transitions";
import { ScrollFx } from "@/components/fx/scroll-fx";
import { Monitor } from "@/components/site/monitor";
import { SystemDiagram } from "@/components/case-study/system-diagram";
import { Testimonials } from "@/components/sections/testimonials";
import { CaseScreens } from "@/components/case-study/case-screens";
import { Band, Button, Label, Panel, Rise, RollingNumber, SectionHeader, UiFragment } from "@/components/system";
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

      {project.weakPoints && project.weakPoints.length > 0 && (
        <Band aria-labelledby="case-weak-title" className="pb-20 min-[900px]:pb-28">
          <div className="wrap grid grid-cols-1 gap-6 min-[900px]:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] min-[900px]:gap-10">
            <h2 id="case-weak-title" className="type-label pt-2 text-muted">
              Weak points of the old way
            </h2>
            <ul className="flex max-w-[34em] flex-col gap-3">
              {project.weakPoints.map((w) => (
                <li key={w} className="flex gap-3 text-[17px] leading-relaxed">
                  <span aria-hidden="true" className="mt-0.5 text-copper">
                    ✕
                  </span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </Band>
      )}

      {/* 4. What I built: the three-layer diagram. */}
      <SystemDiagram project={project} />

      {project.video && (
        <Band aria-label="Walkthrough" className="section-pad">
          <div className="wrap">
            <SectionHeader label="Walkthrough" title={<>See it <em>run</em></>} intro={project.video.caption} />
            <ScrollFx effects={["tilt"]}>
              <div data-fx="tilt">
                <Monitor label={`${project.title.toLowerCase()} · walkthrough`}>
                  {/* Plays only when pressed (controls), so no autoplay concerns; WebM first, then MP4. */}
                  <video
                    className="absolute inset-0 size-full object-cover"
                    poster={project.poster?.src ?? project.video.poster}
                    controls
                    preload="none"
                    playsInline
                  >
                    {project.video.webm && <source src={project.video.webm} type="video/webm" />}
                    {project.video.mp4 && <source src={project.video.mp4} type="video/mp4" />}
                    {project.video.src && !project.video.mp4 && !project.video.webm && <source src={project.video.src} />}
                  </video>
                </Monitor>
              </div>
            </ScrollFx>
          </div>
        </Band>
      )}

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
              <ScrollFx effects={["parallax"]} className="mb-12 flex flex-wrap gap-4">
                {project.uiFragments.map((f, i) => (
                  <div key={f.text} data-fx-speed={[0.15, 0.45, 0.28][i % 3]}>
                    <UiFragment tag={f.tag} text={f.text} actions={f.actions} live={i === 0} className="w-[280px]" />
                  </div>
                ))}
              </ScrollFx>
            )}

            {agents.length > 0 && (
              <ScrollFx as="ul" effects={["rise"]} className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[1000px]:grid-cols-4">
                {agents.map((a, i) => (
                  <li key={a.name} data-fx="item">
                    <Panel className="flex h-full flex-col gap-3 p-5">
                      <div className="flex items-center justify-between">
                        <Label>Agent {String(i + 1).padStart(2, "0")}</Label>
                        <span
                          aria-hidden="true"
                          className={a.needsYou ? "size-2 rounded-full bg-walnut" : "size-2 rounded-full bg-paper-edge"}
                        />
                      </div>
                      <h3 className="font-display text-lg font-extrabold leading-tight">
                        {a.name}
                      </h3>
                      <p className="mt-auto font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                        {a.needsYou ? "Needs you · " : ""}
                        {a.status}
                      </p>
                    </Panel>
                  </li>
                ))}
              </ScrollFx>
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

      {project.decisions && project.decisions.length > 0 && (
        <Band aria-label="Key decisions" className="section-pad border-t border-paper-edge">
          <div className="wrap">
            <SectionHeader label="Key decisions" title={<>Why it&apos;s <em>built this way</em></>} />
            <ScrollFx as="ol" effects={["rise"]} className="grid grid-cols-1 gap-5 min-[900px]:grid-cols-2">
              {project.decisions.map((d, i) => (
                <li key={d.title} data-fx="item">
                  <Panel className="flex h-full gap-5 p-7">
                    <span className="font-display text-[32px] font-extrabold leading-none text-walnut">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="type-card text-[22px]">{d.title}</h3>
                      <p className="mt-3 text-[15.5px] text-muted">{d.text}</p>
                      {d.tradeoff && (
                        <p className="mt-4 border-t border-dashed border-paper-edge pt-3 text-[15px]">
                          <Label className="mr-2">Trade-off</Label>
                          <span className="text-muted">{d.tradeoff}</span>
                        </p>
                      )}
                    </div>
                  </Panel>
                </li>
              ))}
            </ScrollFx>
          </div>
        </Band>
      )}

      {/* 6. Screens: the captioned gallery from the admin. */}
      <CaseScreens screens={project.screens} title={project.title} />

      {/* 7. Result / status: real figures only; a product build says so plainly and states what it proves. */}
      {project.results && project.results.length > 0 ? (
        <Band tone="ink" aria-label="Results" className="section-pad">
          <div className="wrap">
            <SectionHeader label="Results" title={<>What it <em>changed</em></>} />
            <dl className="grid grid-cols-1 gap-5 min-[640px]:grid-cols-2 min-[1000px]:grid-cols-3">
              {project.results.map((r) => (
                <Panel key={r.label} tone="ink" className="p-7">
                  <dt>
                    <Label>{r.label}</Label>
                  </dt>
                  <dd className="mt-3 font-display text-[clamp(40px,5vw,64px)] font-extrabold leading-none text-copper">
                    <RollingNumber value={r.value} />
                  </dd>
                </Panel>
              ))}
            </dl>
          </div>
        </Band>
      ) : project.status === "product" && project.proves ? (
        <Band tone="ink" aria-labelledby="case-status-title" className="section-pad">
          <div className="wrap grid grid-cols-1 gap-6 min-[900px]:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] min-[900px]:gap-10">
            <div>
              <Label>Status</Label>
              <h2 id="case-status-title" className="type-section mt-4">
                What it <em>proves</em>
              </h2>
            </div>
            <div className="flex max-w-[34em] flex-col gap-4">
              <p className="m-0 font-mono text-[13px] uppercase tracking-[0.12em] text-copper">
                Product build · not a client project, so no client figures
              </p>
              <p className="m-0 text-[18px] leading-relaxed">{project.proves}</p>
            </div>
          </div>
        </Band>
      ) : null}

      {/* 8. What I'd do next. */}
      {project.nextSteps && project.nextSteps.length > 0 && (
        <Band aria-labelledby="case-next-steps-title" className="section-pad">
          <div className="wrap grid grid-cols-1 gap-6 min-[900px]:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] min-[900px]:gap-10">
            <h2 id="case-next-steps-title" className="type-section">
              What I&apos;d do <em>next</em>
            </h2>
            <ol className="flex max-w-[34em] flex-col gap-4">
              {project.nextSteps.map((n, i) => (
                <li key={n} className="flex gap-4 text-[17px] leading-relaxed">
                  <span className="font-display text-[22px] font-extrabold leading-none text-copper">{String(i + 1).padStart(2, "0")}</span>
                  {n}
                </li>
              ))}
            </ol>
          </div>
        </Band>
      )}

      {/* The client's words for this project, when there are any. */}
      <Testimonials items={testimonials} id="case-testimonials" />

      {next && next.slug !== project.slug && (
        <Band aria-label="Next project" className="section-pad border-t border-paper-edge">
          <div className="wrap">
            <Label>Next case</Label>
            {/* The next case as a card; its picture morphs into that page's main screen. */}
            <Link
              href={`/work/${next.slug}`}
              className="press group mt-5 grid grid-cols-1 items-center gap-6 overflow-hidden rounded-[24px] bg-paper-hi p-3 shadow-raised min-[768px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] min-[768px]:gap-10 min-[768px]:p-4"
            >
              <ResponsiveMorph slug={next.slug}>
                <ProjectTile project={next} sizes="(min-width: 768px) 45vw, 92vw" className="aspect-[16/10] w-full rounded-[16px]" />
              </ResponsiveMorph>
              <span className="flex flex-col gap-3 px-3 pb-4 min-[768px]:px-0 min-[768px]:pb-0 min-[768px]:pr-6">
                <span className="type-label text-muted">{next.kind}</span>
                <span className="font-display text-[clamp(32px,4.6vw,64px)] font-extrabold leading-[0.95] tracking-[-0.03em] transition-colors group-hover:text-walnut">
                  {next.title} <span aria-hidden="true">→</span>
                </span>
                <span className="line-clamp-3 max-w-[36em] text-muted">{next.outcome ?? next.summary}</span>
              </span>
            </Link>
          </div>
        </Band>
      )}

      <Band tone="ink" aria-label="Start a project" data-page-cta="" className="section-pad">
        <div className="wrap flex flex-col items-start gap-8 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
          <div>
            <Label>Your project</Label>
            <p className="mt-4 max-w-[14em] font-display text-[clamp(34px,4.6vw,64px)] font-extrabold leading-[0.92] tracking-[-0.035em]">
              Want this for <em className="font-bold text-copper">your business?</em>
            </p>
          </div>
          <Button href="/#contact" variant="paper" size="lg" arrow>
            Start a project
          </Button>
        </div>
      </Band>

      <BandTransitions />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </main>
  );
}
