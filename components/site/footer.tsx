import { cacheLife } from "next/cache";
import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { Button, Label, StatusLight } from "@/components/system";
import { getSiteSettings } from "@/lib/content";
import { Clock } from "./clock";
import { FooterSlab } from "./footer-slab";
import { navLinks } from "./nav-links";
import { Wordmark } from "./wordmark";

/**
 * Footer (DESIGN.md §8): the page ends on an espresso band. The call to
 * action, your availability light and direct contact rows sit above the name
 * in lit copper; the bottom bar has the sitemap, local time and back to top.
 * Links are absolute so they work from every page.
 */
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer() {
  const [year, settings] = await Promise.all([currentYear(), getSiteSettings()]);
  const links = [...navLinks, { id: "contact", label: "Contact" }];

  const contacts = [
    settings.email && { label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    settings.linkedin && { label: "LinkedIn", value: prettyUrl(settings.linkedin), href: settings.linkedin },
    settings.bookingUrl && { label: "Book a call", value: "Pick a time that suits you", href: settings.bookingUrl },
    !settings.email && { label: "Message", value: "Use the contact form", href: "/#contact" },
  ].filter(Boolean) as { label: string; value: string; href: string }[];

  return (
    <footer className="tone-ink footer-band relative mt-10 overflow-hidden rounded-t-[32px] pb-8 pt-[88px] text-paper min-[900px]:rounded-t-[44px]">
      <div className="wrap relative">
        <div className="grid grid-cols-1 items-center gap-12 min-[900px]:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Label accent>End of transmission</Label>
            <p className="mt-4 max-w-[13em] font-display text-[clamp(30px,3.6vw,48px)] font-extrabold leading-[0.95] tracking-[-0.03em] [font-variation-settings:'wdth'_104]">
              Have a business that should run itself?
            </p>
            {settings.availability && (
              <p className="mt-5 flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.12em] text-muted-ink">
                <StatusLight size="md" />
                {settings.availability}
              </p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button href="/#contact" variant="copper" arrow>
                Start a project
              </Button>
              {settings.bookingUrl && (
                <Button href={settings.bookingUrl} variant="paper">
                  Book a call
                </Button>
              )}
            </div>
          </div>
          <FooterSlab />
        </div>

        {/* Direct lines */}
        <ul
          aria-label="Contact"
          className="mt-16 grid grid-cols-1 border-y border-ink-3 min-[700px]:grid-flow-col min-[700px]:auto-cols-fr min-[700px]:divide-x min-[700px]:divide-ink-3"
        >
          {contacts.map((c) => {
            const external = /^https?:/.test(c.href);
            return (
              <li key={c.label} className="border-b border-ink-3 min-[700px]:border-b-0">
                <a
                  href={c.href}
                  {...(external && { target: "_blank", rel: "noopener" })}
                  className="group flex items-center justify-between gap-4 px-1 py-5 transition-colors hover:bg-white/[0.03] min-[700px]:px-5"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-ink">{c.label}</span>
                    <span className="mt-1 block truncate text-[16px] font-semibold text-paper group-hover:text-copper">{c.value}</span>
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-5 shrink-0 text-muted-ink transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-copper"
                  />
                  {external && <span className="sr-only">(opens in a new tab)</span>}
                </a>
              </li>
            );
          })}
          <li className="px-1 py-5 min-[700px]:px-5">
            <span className="block font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-ink">Local time · works worldwide</span>
            <Clock className="mt-1 block font-mono text-[14px] font-semibold text-paper" />
          </li>
        </ul>

        <Wordmark text="Shayan Ahmed" className="mt-14" />

        <div className="mt-8 flex flex-col gap-5 border-t border-ink-3 pt-6 font-mono text-[11px] tracking-[0.08em] text-muted-ink min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
          <span>© {year} Shayan Ahmed · Websites, systems and automation</span>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-[22px] gap-y-2">
              {links.map((l) => (
                <li key={l.id}>
                  <Link href={`/#${l.id}`} className="transition-colors hover:text-copper">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <a
            href="#main"
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-ink-3 px-3.5 py-2 text-paper transition-colors hover:border-copper hover:text-copper"
          >
            Back to top
            <ArrowUp aria-hidden="true" className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}

function prettyUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}
