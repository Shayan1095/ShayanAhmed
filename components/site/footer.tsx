import { cacheLife } from "next/cache";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { Button, Label } from "@/components/system";
import { getArchiveProjects, getBuildCount, getFeaturedProjects, getSiteSettings } from "@/lib/content";
import { ProjectTile } from "./project-tile";
import { socialLinks, whatsappHref } from "@/lib/content/socials";
import { Clock } from "./clock";
import { FooterReveal } from "./footer-reveal";
import { SocialKeys } from "./social-keys";
import { navLinks } from "./nav-links";
import { Wordmark } from "./wordmark";

/**
 * Footer (DESIGN.md §8), top to bottom: the sign-off (call to action) beside
 * the social logos; recent work (the latest three builds); the bottom bar
 * (©, sitemap, local time, back to top); and the name, huge and edge to edge
 * in lit copper, as the last thing on the page. Links are absolute so they
 * work from every page.
 */
const BAND: React.CSSProperties = {
  // Espresso on the light site; dark mode sets --footer-band to a deeper night band (globals.css).
  backgroundImage:
    "var(--footer-band, radial-gradient(70% 55% at 50% 108%, rgb(201 133 63 / 0.22), transparent 70%), radial-gradient(120% 80% at 50% 0%, #24211d 0%, #110f0d 62%))",
};
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer() {
  const [year, settings, featured, archive, total] = await Promise.all([
    currentYear(),
    getSiteSettings(),
    getFeaturedProjects(),
    getArchiveProjects(),
    getBuildCount(),
  ]);
  const recent = [...featured, ...archive].slice(0, 3);
  const links = [...navLinks, { id: "contact", label: "Contact" }];
  const socials = socialLinks(settings);
  const whatsapp = whatsappHref(settings.whatsapp);

  return (
    <footer
      className="tone-ink relative overflow-hidden bg-[#110f0d] pt-[72px] text-paper min-[900px]:rounded-t-[44px] min-[900px]:pt-[88px]"
      style={BAND}
    >
      {/* Copper hairline catching the light along the top edge. */}
      <span aria-hidden="true" className="absolute inset-x-[8%] top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgb(224 154 79 / 0.55), transparent)" }} />
      <div data-footer-inner className="wrap relative">
        <div data-footer-top className="grid grid-cols-1 items-center gap-12 min-[900px]:grid-cols-[minmax(0,1fr)_auto]">
          {/* Hidden on the home page on phones: the contact form right above asks the same. */}
          <div data-footer-signoff>
            <Label accent>End of transmission</Label>
            {/* The section heading style, like every other h2 on the site. */}
            <h2 className="type-section mt-4 max-w-[13em]">
              Have a business that should <em>run itself?</em>
            </h2>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button href="/#contact" variant="copper" arrow>
                Start a project
              </Button>
              {whatsapp && (
                <Button href={whatsapp} variant="paper" target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </Button>
              )}
              {settings.bookingUrl && (
                <Button href={settings.bookingUrl} variant="paper">
                  Book a call
                </Button>
              )}
            </div>
          </div>
          {/* Every way to reach me: the real brand logos. */}
          {socials.length > 0 && (
            <div className="flex flex-col gap-5 min-[900px]:items-end">
              <Label accent>Find me elsewhere</Label>
              <SocialKeys links={socials} />
            </div>
          )}
        </div>

        {/* Recent work: the latest three builds, each opening its case study (or the work page). */}
        {recent.length > 0 && (
          <section aria-labelledby="footer-work" className="mt-12 border-t border-ink-3 pt-8 min-[900px]:mt-20 min-[900px]:pt-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Label accent>
                <span id="footer-work">Recent work</span>
              </Label>
              <Link href="/work" className="group inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-copper">
                All {String(total).padStart(2, "0")} builds
                <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
            <ul className="grid grid-cols-1 gap-3 min-[640px]:grid-cols-3 min-[640px]:gap-5">
              {recent.map((p) => (
                <li key={p.slug}>
                  <Link transitionTypes={["nav-forward"]}
                    href={p.hasCaseStudy ? `/work/${p.slug}` : "/work"}
                    className="group flex items-center gap-4 rounded-[18px] p-2 pr-4 transition-colors hover:bg-white/[0.04] min-[640px]:flex-col min-[640px]:items-stretch min-[640px]:p-0 min-[640px]:pr-0 min-[640px]:hover:bg-transparent"
                  >
                    <span className="block w-24 shrink-0 overflow-hidden rounded-[12px] shadow-[0_0_0_1px_rgb(255_255_255/.06)] min-[640px]:w-full min-[640px]:rounded-[16px]">
                      <ProjectTile
                        project={p}
                        label={false}
                        sizes="(min-width: 640px) 30vw, 96px"
                        className="aspect-[16/10] w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
                      />
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="type-label truncate text-muted-ink">{p.kind}</span>
                      <span className="truncate font-display text-[19px] font-extrabold leading-tight tracking-[-0.01em] transition-colors group-hover:text-copper min-[900px]:text-[22px]">
                        {p.title}
                        <span aria-hidden="true" className="ml-1.5 inline-block opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                          →
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Bottom bar. */}
        <div className="mt-14 flex flex-col gap-4 border-t border-ink-3 pt-6 font-mono text-[11px] tracking-[0.08em] text-muted-ink min-[900px]:mt-20 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between min-[900px]:gap-6">
          <p className="m-0 flex flex-col gap-1">
            <span className="whitespace-nowrap text-paper">© {year} Shayan Ahmed</span>
            <span>Designed and built in Pakistan · working worldwide</span>
          </p>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-5 max-[899px]:-my-3">
              {links.map((l) => (
                <li key={l.id}>
                  <Link href={`/#${l.id}`} className="inline-flex min-h-11 items-center transition-colors hover:text-copper">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {/* Phones: clock and back-to-top share a line. */}
          <div className="flex items-center justify-between gap-4 min-[900px]:gap-5">
            <Clock className="min-w-0 min-[360px]:whitespace-nowrap" />
            <a
              href="#main"
              aria-label="Back to top"
              className="group inline-flex w-fit shrink-0 items-center justify-center gap-2 whitespace-nowrap min-h-11 rounded-full border border-ink-3 text-paper max-[899px]:size-11 min-[900px]:px-4 transition-colors hover:border-copper hover:text-copper"
            >
              <span className="max-[899px]:hidden">Back to top</span>
              <ArrowUp aria-hidden="true" className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>

      {/* The name, huge and edge to edge: the last thing on the page. Its lower
          edge sits on the footer's bottom, as if rising out of it. */}
      <div className="relative mt-10 px-3 pb-3 min-[900px]:mt-14 min-[900px]:px-5 min-[900px]:pb-5">
        <Wordmark text="Shayan Ahmed" huge />
      </div>
      <FooterReveal />
    </footer>
  );
}
