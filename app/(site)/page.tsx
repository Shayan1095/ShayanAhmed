import { About } from "@/components/sections/about";
import { Archive } from "@/components/sections/archive";
import { Contact } from "@/components/sections/contact";
import { FaqSection } from "@/components/sections/faq";
import { Process } from "@/components/sections/process";
import { Services } from "@/components/sections/services";
import { Testimonials } from "@/components/sections/testimonials";
import { Work } from "@/components/sections/work";
import { Hero } from "@/components/hero/hero";
import { homeJsonLd, JsonLd } from "@/components/site/json-ld";
import {
  getArchiveProjects,
  getFaqs,
  getFeaturedProjects,
  getSiteSettings,
  getTestimonials,
} from "@/lib/content";

export default async function HomePage() {
  const [settings, featured, archive, testimonials, faqs] = await Promise.all([
    getSiteSettings(),
    getFeaturedProjects(),
    getArchiveProjects(),
    getTestimonials(),
    getFaqs(),
  ]);
  const brandsAttire = featured.find((p) => p.slug === "brands-attire");

  return (
    <main id="main">
      <Hero settings={settings} storefront={brandsAttire?.customerView ?? brandsAttire?.cover} />

      <Services />
      <Work projects={featured} />
      <Archive projects={archive} />
      <Process />
      <About settings={settings} />
      <Testimonials items={testimonials} />
      <FaqSection items={faqs} />
      <Contact settings={settings} />
      <JsonLd data={homeJsonLd(settings, featured)} />
    </main>
  );
}
