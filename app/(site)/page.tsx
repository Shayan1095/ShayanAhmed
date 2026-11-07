import { Hero } from "@/components/hero/hero";
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
import { homeJsonLd, JsonLd } from "@/components/site/json-ld";
import { Band } from "@/components/system";
import {
  getArchiveProjects,
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
  const [settings, featured, archive, testimonials, faqs] = await Promise.all([
    getSiteSettings(),
    getFeaturedProjects(),
    getArchiveProjects(),
    getTestimonials(),
    getFaqs(),
  ]);
  const flagship = featured.find((p) => p.hasCaseStudy);
  // Chapter numbers run without gaps: Testimonials (06) only shows once there are some.
  const hasTestimonials = testimonials.length > 0;
  const n = (k: number) => String(hasTestimonials ? k : k - 1).padStart(2, "0");

  return (
    <main id="main">
      <Hero caseStudyHref={flagship ? `/work/${flagship.slug}` : undefined} />
      <VelocityMarquee items={["Websites", "Systems", "Automation", "Storefronts", "Admin panels", "Operations agents"]} />
      <Work projects={featured} />
      <Band aria-label="Talk about your project" className="pb-20 max-[767px]:hidden min-[900px]:pb-24">
        <div className="wrap">
          <CtaStrip title="Want a system like this for your business?" />
        </div>
      </Band>
      <Services />
      <Archive projects={archive} limit={3} seeAllHref="/work" />
      <Process>
        <CtaStrip
          tone="ink"
          title="Ready to map out your build?"
          note="It starts with a discovery call, and you get a written summary of goals."
          className="max-[767px]:hidden"
        />
      </Process>
      <VelocityMarquee items={["Milestones you approve", "A live link every week", "A clean handover"]} />
      <About settings={settings} />
      {/* 06 · Testimonials: renders nothing until the first one is added in the admin. */}
      <Testimonials items={testimonials} />
      <FaqSection items={faqs} index={n(7)} />
      <Contact settings={settings} index={n(8)} />
      <JsonLd data={homeJsonLd(settings, featured)} />
      <BandTransitions />
    </main>
  );
}
