import { cacheLife } from "next/cache";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { Button, Label } from "@/components/system";
import { getSiteSettings } from "@/lib/content";
import { socialLinks, whatsappHref } from "@/lib/content/socials";
import { Clock } from "./clock";
import { FooterReveal } from "./footer-reveal";
import { SocialKeys } from "./social-keys";
import { navLinks } from "./nav-links";
import { Wordmark } from "./wordmark";

/**
 * Footer (DESIGN.md §8): the page ends on an espresso band with the call to
 * action and the name in lit copper; the bottom bar has the sitemap, local
 * time and back to top. Links are absolute so they work from every page.
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
  const [year, settings] = await Promise.all([currentYear(), getSiteSettings()]);
  const links = [...navLinks, { id: "contact", label: "Contact" }];
  const socials = socialLinks(settings);
  const whatsapp = whatsappHref(settings.whatsapp);

  return (
    <footer
      className="tone-ink relative overflow-hidden rounded-t-[32px] bg-[#110f0d] pb-8 pt-[88px] text-paper min-[900px]:rounded-t-[44px]"
      style={BAND}
    >
      {/* Copper hairline catching the light along the top edge. */}
      <span aria-hidden="true" className="absolute inset-x-[8%] top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgb(224 154 79 / 0.55), transparent)" }} />
      <div data-footer-inner className="wrap relative">
        <div className="grid grid-cols-1 items-center gap-12 min-[900px]:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Label accent>End of transmission</Label>
            <p className="mt-4 max-w-[13em] font-display text-[clamp(30px,3.6vw,48px)] font-extrabold leading-[0.95] tracking-[-0.03em]">
              Have a business that should run itself?
            </p>
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
          {/* Every way to reach me, as floating copper keycaps (they replace the old device card). */}
          {socials.length > 0 && (
            <div className="flex flex-col gap-5 min-[900px]:items-end">
              <Label accent>Find me elsewhere</Label>
              <SocialKeys links={socials} />
            </div>
          )}
        </div>

        <Wordmark text="Shayan Ahmed" className="mt-20" />

        <div className="mt-8 flex flex-col gap-5 border-t border-ink-3 pt-6 font-mono text-[11px] tracking-[0.08em] text-muted-ink min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
          <span className="whitespace-nowrap">© {year} Shayan Ahmed</span>
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
          <Clock className="whitespace-nowrap" />
          <a
            href="#main"
            className="group inline-flex w-fit shrink-0 items-center gap-2 whitespace-nowrap min-h-11 rounded-full border border-ink-3 px-4 text-paper transition-colors hover:border-copper hover:text-copper"
          >
            Back to top
            <ArrowUp aria-hidden="true" className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
      <FooterReveal />
    </footer>
  );
}
