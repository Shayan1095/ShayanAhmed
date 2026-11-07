import type { Testimonial } from "@/lib/content/types";
import { Band, Label, Rise, Typewriter } from "@/components/system";
import { cn } from "@/lib/utils";

/**
 * 06 Testimonial (cream, inset). Rendered only when at least one testimonial
 * is published with consent. Two or more: horizontal swipe.
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  const many = items.length > 1;

  return (
    <Band aria-label="Client testimonials" className="pb-20 min-[900px]:pb-[110px]">
      <div className="wrap">
        <Rise>
          <div
            className={cn(
              "flex gap-6",
              many && "-mx-4 snap-x snap-mandatory overflow-x-auto px-4 pb-4 [scrollbar-width:none]",
            )}
          >
            {items.map((t) => (
              <figure
                key={t.id}
                className="inset-track relative w-full shrink-0 snap-center rounded-[26px] px-[clamp(24px,6vw,80px)] py-[60px] text-center"
              >
                <span className="absolute right-[26px] top-6 rotate-6 rounded-md border-[1.5px] border-walnut px-[9px] py-[5px] font-mono text-[10px] uppercase tracking-[0.16em] text-walnut">
                  Approved
                </span>
                <Label>
            <Typewriter text="05 · Client words" speed={38} />
          </Label>
                <blockquote className="mx-auto mb-[22px] mt-[18px] max-w-[24em] font-display text-[clamp(24px,3vw,38px)] font-semibold leading-[1.25] tracking-[-0.01em]">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption>
                  <Label>
                    {t.name} · {t.role}, {t.company}
                  </Label>
                </figcaption>
              </figure>
            ))}
          </div>
        </Rise>
      </div>
    </Band>
  );
}
