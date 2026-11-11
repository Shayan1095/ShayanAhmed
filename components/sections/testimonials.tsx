import Image from "next/image";
import { Star } from "lucide-react";
import type { Testimonial } from "@/lib/content/types";
import { Band, Label, Rise, Typewriter } from "@/components/system";
import { cn } from "@/lib/utils";

/** "Sara Malik" → "SM". */
function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

/** "https://www.upwork.com/..." → "upwork.com". */
function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Client words (build brief, Phase 3). One component, two places: the home
 * page (after the case studies, with its chapter number) and inside the
 * matching case study. Only published testimonials with the client's consent
 * reach it; with none it renders nothing. Every detail shown (rating, country,
 * photo, review link) is only what was entered in the admin.
 * Two or more: a horizontal swipe.
 */
export function Testimonials({ items, index, id }: { items: Testimonial[]; index?: string; id?: string }) {
  if (items.length === 0) return null;
  const many = items.length > 1;
  const titleId = `${id ?? "testimonials"}-title`;

  return (
    <Band id={id} aria-labelledby={titleId} className="section-pad">
      <div className="wrap">
        <Label className="mb-3.5 block min-[640px]:mb-[18px]">
          <Typewriter text={index ? `${index} · Client words` : "Client words"} speed={38} />
        </Label>
        <h2 id={titleId} className="type-section mb-8 min-[900px]:mb-12">
          In their <em>words.</em>
        </h2>
        <Rise>
          <ul
            className={cn(
              "flex gap-5",
              many && "-mx-4 snap-x snap-mandatory overflow-x-auto overscroll-x-contain px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            )}
          >
            {items.map((t) => (
              <li
                key={t.id}
                className={cn("shrink-0 snap-start", many ? "w-[min(560px,88vw)]" : "w-full max-w-[860px]")}
              >
                <figure className="inset-track relative flex h-full flex-col gap-6 rounded-[26px] p-[clamp(24px,4vw,44px)]">
                  {t.rating ? (
                    <div role="img" className="flex gap-1" aria-label={`Rated ${t.rating} out of 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          aria-hidden="true"
                          className={n <= t.rating! ? "size-5 fill-[#e8a33d] text-[#e8a33d]" : "size-5 text-paper-edge"}
                        />
                      ))}
                    </div>
                  ) : null}
                  <blockquote className="m-0 font-display text-[clamp(20px,2.4vw,30px)] font-semibold leading-[1.3] tracking-[-0.01em]">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-auto flex items-center gap-4">
                    {/* Their photo, or their initials (never a stock avatar). */}
                    <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_35%_30%,#3a2f25,#1a1511)] shadow-[0_0_0_1.5px_rgb(232_178_122/.35)]">
                      {t.photo ? (
                        <Image src={t.photo.src} alt="" fill sizes="56px" className="object-cover" />
                      ) : (
                        <span aria-hidden="true" className="font-display text-[19px] font-extrabold text-copper">
                          {initials(t.name)}
                        </span>
                      )}
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="font-display text-[18px] font-extrabold leading-tight">{t.name}</span>
                      {(t.role || t.company) && (
                        <span className="text-[14.5px] text-muted">{[t.role, t.company].filter(Boolean).join(", ")}</span>
                      )}
                      {(t.country || t.sourceUrl) && (
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] uppercase tracking-[0.1em] text-muted-ink">
                          {t.country && <span>{t.country}</span>}
                          {t.sourceUrl && (
                            <a
                              href={t.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-11 items-center normal-case tracking-normal text-copper underline-offset-4 hover:underline"
                            >
                              Original review on {host(t.sourceUrl)} <span aria-hidden="true">&nbsp;↗</span>
                            </a>
                          )}
                        </span>
                      )}
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </Rise>
      </div>
    </Band>
  );
}
