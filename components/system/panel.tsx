import { cn } from "@/lib/utils";

type PanelProps = React.ComponentProps<"div"> & {
  as?: "div" | "article" | "section" | "aside" | "li" | "form";
  /** paper: raised cream panel. ink: the same panel on an ink band. */
  tone?: "paper" | "ink";
  /** Corner screws. Hero-level objects only. */
  screws?: boolean;
};

/** Raised panel: any content card (DESIGN.md §5, material 1). */
export function Panel({ as = "div", tone = "paper", screws, className, children, ...props }: PanelProps) {
  const Tag = as as "div";
  return (
    <Tag
      className={cn(
        "relative rounded-panel",
        tone === "paper" ? "raised" : "ink-raised tone-ink text-paper",
        className,
      )}
      {...props}
    >
      {screws && <Screws tone={tone} />}
      {children}
    </Tag>
  );
}

export function Screws({ tone = "paper", inset = 14 }: { tone?: "paper" | "ink"; inset?: number }) {
  const ink: React.CSSProperties | undefined =
    tone === "ink"
      ? { background: "radial-gradient(circle at 35% 30%, #4a453e, #23201c 70%)", boxShadow: "none" }
      : undefined;
  const pos = [
    { top: inset, left: inset },
    { top: inset, right: inset },
    { bottom: inset, left: inset },
    { bottom: inset, right: inset },
  ];
  return (
    <span aria-hidden="true">
      {pos.map((style, i) => (
        <i key={i} className="screw" style={{ ...style, ...ink }} />
      ))}
    </span>
  );
}
