import { cn } from "@/lib/utils";

type BandProps = React.ComponentProps<"section"> & {
  as?: "section" | "div" | "footer" | "header";
  /** Bands alternate cream and ink to mark chapters (DESIGN.md §8). */
  tone?: "paper" | "ink";
};

/** A full-width chapter of the page. Put a `wrap` container inside. */
export function Band({ as = "section", tone = "paper", className, ...props }: BandProps) {
  const Tag = as as "section";
  return (
    <Tag
      data-band={tone}
      className={cn("relative", tone === "ink" && "tone-ink bg-ink text-paper", className)}
      {...props}
    />
  );
}
