import { PageTransition } from "@/components/site/page-transition";
import { Hero } from "@/components/hero/hero";
import { MeetBuilder } from "@/components/sections/meet-builder";
import { About } from "@/components/sections/about";
import { Archive } from "@/components/sections/archive";
import { Contact } from "@/components/sections/contact";
import { FaqSection } from "@/components/sections/faq";
import { Process } from "@/components/sections/process";
import { Services } from "@/components/sections/services";
import { Testimonials } from "@/components/sections/testimonials";
import { Work } from "@/components/sections/work";
import { BandTransitions } from "@/components/fx/band-transitions";
import { VelocityMarquee } from "@/components/fx/velocity-marquee";
import { CtaStrip } from "@/components/site/cta-strip";
import { SocialOrbit } from "@/components/sections/social-orbit";
import { orbitLinks, socialLinks } from "@/lib/content/socials";
import { homeJsonLd, JsonLd } from "@/components/site/json-ld";
import { Band } from "@/components/system";
import {
  getArchiveProjects,
  getBuildCount,
  getFaqs,
  getFeaturedProjects,
  getSiteSettings,
  getTestimonials,
} from "@/lib/content";

/**
 * Homepage, ordered around a client's decision: see proof first (work), then
 * what's on offer (services), how it runs (process), who builds it (about),
 * then questions and contact. Calls to action sit where decisions happen.
 */
export default async function HomePage() {
  const [settings, featured, archive, testimonials, faqs, buildCount] = await Promise.all([
    getSiteSettings(),
    getFeaturedProjects(),
    getArchiveProjects(),
    getTestimonials(),
    getFaqs(),
    getBuildCount(),
  ]);
  const flagship = featured.find((p) => p.hasCaseStudy);
  // Social orbit: real profiles once any are saved (email alone is not enough);
  // in development, stand-ins so the section can be previewed before then.
  const socials = socialLinks(settings);
  const orbit = orbitLinks(socials, process.env.NODE_ENV !== "production");
  // Two logos would look empty: the orbit appears once there are three, at least one a real profile.
  const showOrbit = orbit.length >= 3 && orbit.some((l) => l.key !== "email");
  // Chapter numbers come from this one ordered list, so they always run 01, 02,
  // 03... without gaps; sections that render nothing (no testimonials, no FAQ,
  // no social profiles yet) are left out of it.
  const chapters = [
    "builder",
    "work",
    testimonials.length > 0 && "testimonials",
    "services",
    archive.length > 0 && "archive",
    "process",
    "about",
    faqs.length > 0 && "faq",
    showOrbit && "elsewhere",
    "contact",
  ].filter(Boolean) as string[];
  const n = (id: string) => String(chapters.indexOf(id) + 1).padStart(2, "0");

  return (
    <PageTransition>
      <main id="main">
      <Hero caseStudyHref={flagship ? `/work/${flagship.slug}` : undefined} />
      <MeetBuilder
        video={settings.introVideo}
        alerts={flagship?.uiFragments ?? []}
        caseHref={flagship ? `/work/${flagship.slug}` : undefined}
      />
      <VelocityMarquee items={["Websites", "Systems", "Automation", "Storefronts", "Admin panels", "Operations agents"]} />
      <Work index={n("work")} projects={featured} totalBuilds={buildCount} />
      {/* Client words right after the case studies; nothing until the first one is published in the admin. */}
      <Testimonials items={testimonials} index={n("testimonials")} id="testimonials" />
      <Band aria-label="Talk about your project" className="pb-20 max-[767px]:hidden min-[900px]:pb-24">
        <div className="wrap">
          <CtaStrip title="Want a system like this for your business?" />
        </div>
      </Band>
      <Services index={n("services")} />
      {/* A shorter bottom: "See all builds" ends the section, so no long blank run after it. */}
      <Archive projects={archive} limit={3} seeAllHref="/work" total={buildCount} index={n("archive")} codeStart={featured.length + 1} className="section-pad pb-10! min-[900px]:pb-16!" />
      <Process index={n("process")} />
      <VelocityMarquee items={["Milestones you approve", "A live link every week", "A clean handover"]} />
      <About settings={settings} index={n("about")} />
      <FaqSection items={faqs} index={n("faq")} />
      {showOrbit && <SocialOrbit links={orbit} index={n("elsewhere")} />}
      <Contact settings={settings} index={n("contact")} />
      <JsonLd data={homeJsonLd(settings, featured)} />
      <BandTransitions />
    </main>
    </PageTransition>
  );
}
