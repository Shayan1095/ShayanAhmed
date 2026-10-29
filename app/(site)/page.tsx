import { Hero } from "@/components/hero/hero";
import { About } from "@/components/sections/about";
import { Archive } from "@/components/sections/archive";
import { Contact } from "@/components/sections/contact";
import { FaqSection } from "@/components/sections/faq";
import { Process } from "@/components/sections/process";
import { Services } from "@/components/sections/services";
import { Testimonials } from "@/components/sections/testimonials";
import { Work } from "@/components/sections/work";
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
  const brandsAttire = featured.find((p) => p.slug === "brands-attire");

  return (
    <main id="main">
      <Hero
        settings={settings}
        storefront={brandsAttire?.customerView ?? brandsAttire?.cover}
        caseStudyHref={flagship ? `/work/${flagship.slug}` : undefined}
      />
      <Work projects={featured} />
      <Band aria-label="Talk about your project" className="pb-20 min-[900px]:pb-24">
        <div className="wrap">
          <CtaStrip title="Want a system like this for your business?" />
        </div>
      </Band>
      <Services />
      <Archive projects={archive} limit={3} seeAllHref="/work" />
      <Process />
      <Band tone="ink" aria-label="Plan your build" className="pb-20 min-[900px]:pb-[120px]">
        <div className="wrap">
          <CtaStrip tone="ink" title="Ready to map out your build?" note="It starts with a discovery call, and you get a written summary of goals." />
        </div>
      </Band>
      <About settings={settings} />
      <Testimonials items={testimonials} />
      <FaqSection items={faqs} />
      <Contact settings={settings} />
      <JsonLd data={homeJsonLd(settings, featured)} />
    </main>
  );
}
