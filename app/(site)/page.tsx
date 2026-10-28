import { About } from "@/components/sections/about";
import { Archive } from "@/components/sections/archive";
import { Contact } from "@/components/sections/contact";
import { FaqSection } from "@/components/sections/faq";
import { Process } from "@/components/sections/process";
import { Services } from "@/components/sections/services";
import { Testimonials } from "@/components/sections/testimonials";
import { Work } from "@/components/sections/work";
import { Label, SplitReveal } from "@/components/system";
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

  return (
    <main id="main">
      {/* Temporary hero. The full 2D hero (DESIGN.md §8 Hero) replaces this next. */}
      <section id="hero" aria-label="Introduction" className="wrap flex min-h-svh flex-col justify-center pt-28">
        <Label className="mb-6 block">Full-stack developer · Pakistan</Label>
        <SplitReveal as="h1" className="type-hero" start="top bottom">
          Websites with the systems <em>built in</em>.
        </SplitReveal>
      </section>

      <Services />
      <Work projects={featured} />
      <Archive projects={archive} />
      <Process />
      <About settings={settings} />
      <Testimonials items={testimonials} />
      <FaqSection items={faqs} />
      <Contact settings={settings} />
    </main>
  );
}
