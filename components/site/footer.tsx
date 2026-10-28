import { cacheLife } from "next/cache";
import Link from "next/link";
import { Button, Label } from "@/components/system";
import { Clock } from "./clock";
import { FooterSlab } from "./footer-slab";
import { navLinks } from "./nav-links";
import { Wordmark } from "./wordmark";

/** Footer (DESIGN.md §8). Links are absolute so they work from every page. */
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer() {
  const year = await currentYear();
  const links = [...navLinks, { id: "contact", label: "Contact" }];

  return (
    <footer className="relative overflow-hidden pb-9 pt-[90px]">
      <div className="wrap">
        <div className="grid grid-cols-1 items-center gap-10 min-[900px]:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Label>End of transmission</Label>
            <p className="mt-4 max-w-[13em] font-display text-[clamp(28px,3.4vw,44px)] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] [font-variation-settings:'wdth'_116]">
              Have a business that should run itself?
            </p>
            <Button href="/#contact" arrow className="mt-6">
              Start a project
            </Button>
          </div>
          <FooterSlab />
        </div>

        <Wordmark text="Shayan Ahmed" className="mt-16" />

        <div className="mt-[30px] flex flex-wrap justify-between gap-4 border-t border-paper-edge pt-[22px] font-mono text-[11px] tracking-[0.08em] text-muted">
          <span>© {year} Shayan Ahmed</span>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-[22px] gap-y-2">
              {links.map((l) => (
                <li key={l.id}>
                  <Link href={`/#${l.id}`} className="transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href="#main" className="transition-colors hover:text-ink">
                  Back to top ↑
                </a>
              </li>
            </ul>
          </nav>
          <Clock />
        </div>
      </div>
    </footer>
  );
}
