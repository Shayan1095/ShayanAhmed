import type { Testimonial } from "@/lib/content/types";
import { Rise } from "@/components/system";

/** The quote to pull: best rated first, then the shortest (it is set large). */
export function pickPullQuote(items: Testimonial[]) {
  return [...items].sort(
    (a, b) =>
      (b.rating ?? 0) - (a.rating ?? 0) || a.quote.length - b.quote.length,
  )[0];
}

/** A magazine pull quote on the paper section (build brief, Phase 6). */
export function PullQuote({ item }: { item: Testimonial }) {
  const who = [item.role, item.company].filter(Boolean).join(", ");
  return (
    <Rise className="mx-auto mt-20 max-w-[44rem] border-y-2 border-ink py-8 text-center min-[900px]:mt-28 min-[900px]:py-12">
      <figure className="m-0">
        <blockquote className="m-0">
          <p className="font-display text-[clamp(26px,4.2vw,44px)] font-extrabold leading-[1.12] tracking-[-0.02em] text-ink">
            <span aria-hidden="true" className="text-copper">
              “
            </span>
            {item.quote}
            <span aria-hidden="true" className="text-copper">
              ”
            </span>
          </p>
        </blockquote>
        <figcaption className="type-label mt-6 text-tone-muted">
          {item.name}
          {who && ` · ${who}`}
        </figcaption>
      </figure>
    </Rise>
  );
}
