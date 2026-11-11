import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Rise, SplitReveal } from "./reveal";
import { Typewriter } from "./typewriter";

type SectionHeaderProps = {
  /** Chapter number, e.g. "01". */
  index?: string;
  /** Chapter name, e.g. "Services". */
  label: string;
  /** Title. Wrap emphasis words in <em>. */
  title: React.ReactNode;
  /** One-line intro. */
  intro?: React.ReactNode;
  as?: "h1" | "h2";
  /** id for the heading itself (for aria-labelledby). Never put ids inside the
   * title: the line split copies inner elements onto every line. */
  titleId?: string;
  /** Optional control on the right instead of the intro (e.g. a filter). */
  aside?: React.ReactNode;
  className?: string;
};

/** Label + split-reveal title + one-line intro (DESIGN.md §5). */
export function SectionHeader({ index, label, title, intro, as = "h2", titleId, aside, className }: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "mb-8 grid grid-cols-1 items-end gap-4 min-[640px]:mb-10 min-[640px]:gap-[18px] min-[900px]:mb-14 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,0.62fr)] min-[900px]:gap-9",
        className,
      )}
    >
      <div>
        <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 min-[640px]:mb-[18px]">
          <Label>
            <Typewriter text={index ? `${index} · ${label}` : label} speed={38} />
          </Label>
          {/* The magazine's folio, carried past the hero: issue and page. */}
          {index && (
            <Label aria-hidden="true" className="opacity-75">
              No. 01 · p. {index}
            </Label>
          )}
        </div>
        <SplitReveal as={as} id={titleId} className="type-section">
          {title}
        </SplitReveal>
      </div>
      {intro && (
        <Rise as="p" className="max-w-[30em] text-[17px] text-tone-muted">
          {intro}
        </Rise>
      )}
      {aside && <div className="min-[900px]:justify-self-end">{aside}</div>}
    </header>
  );
}
