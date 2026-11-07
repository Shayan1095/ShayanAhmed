import type { Project } from "@/lib/content/types";
import { cn } from "@/lib/utils";

/** First letters of the first two words: "Brands Attire" → "BA". */
export function initials(title: string) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

/**
 * A project's picture for cards and rows: its screenshot when there is one,
 * otherwise an intentional ink tile with the project's initials (never an
 * empty frame). The parent sets the size and aspect ratio.
 */
export function ProjectTile({
  project,
  className,
  sizes = "88vw",
  label = true,
}: {
  project: Pick<Project, "title" | "cover" | "customerView" | "monitorLabel">;
  className?: string;
  sizes?: string;
  /** Show the monitor label under the initials on bigger tiles. */
  label?: boolean;
}) {
  const image = project.customerView ?? project.cover;
  return (
    <span className={cn("tone-ink relative block overflow-hidden bg-ink [container-type:inline-size]", className)}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote screenshots at their own size; lazy below the fold
        <img
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          sizes={sizes}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover object-top"
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(80%_70%_at_50%_0%,rgb(201_133_63/.24),transparent_70%),linear-gradient(180deg,#1b1714,#0d0b09)]"
        >
          <span className="font-display text-[clamp(28px,12cqw,64px)] font-black leading-none tracking-[-0.03em] text-copper">
            {initials(project.title)}
          </span>
          {label && project.monitorLabel && (
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-ink">{project.monitorLabel}</span>
          )}
        </span>
      )}
    </span>
  );
}
