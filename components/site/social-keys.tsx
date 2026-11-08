import type { SocialLink } from "@/lib/content/socials";
import { BrandGlyph } from "./brand-glyph";

/**
 * "Find me elsewhere" in the footer (every page): the same real brand logos
 * as the home page orbit, as a quiet row of round buttons. Hover lifts a
 * logo and lights its ring. Real links with names for screen readers.
 */
export function SocialKeys({ links }: { links: SocialLink[] }) {
  if (links.length === 0) return null;
  return (
    <nav aria-label="Find me elsewhere">
      <ul className="flex flex-wrap gap-2.5">
        {links.map((l) => (
          <li key={l.key}>
            <a
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noopener noreferrer" : undefined}
              aria-label={`${l.key === "email" ? "Email Shayan" : `Shayan on ${l.label}`}${l.external ? " (opens in a new tab)" : ""}`}
              title={l.label}
              className="grid size-12 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#2b2622,#141110_70%)] shadow-[inset_0_1px_0_rgb(255_255_255/.1),0_0_0_1px_rgb(255_255_255/.07)] transition-[transform,box-shadow] duration-200 ease-out-expo hover:-translate-y-1 hover:shadow-[inset_0_1px_0_rgb(255_255_255/.14),0_0_0_1px_rgb(232_178_122/.5),0_0_24px_-4px_rgb(201_133_63/.5)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper active:scale-95"
            >
              <BrandGlyph platform={l.key} className="size-[22px]" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
