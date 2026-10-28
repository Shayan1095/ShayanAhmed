import { cn } from "@/lib/utils";

type StatusLightProps = {
  on?: boolean;
  /** Visible text beside the light. */
  label?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  /** Slow pulse while on. */
  pulse?: boolean;
  className?: string;
};

const sizes = { sm: "size-1.5", md: "size-2", lg: "size-3" } as const;

/**
 * Copper status light. Accent discipline: keep one lit light per view
 * (DESIGN.md §3.7). Off lights read as a dark recessed LED.
 */
export function StatusLight({ on = true, label, size = "md", pulse = true, className }: StatusLightProps) {
  const dot = (
    <span
      aria-hidden="true"
      data-on={on || undefined}
      className={cn(
        "inline-block shrink-0 rounded-full transition-[background-color,box-shadow] duration-300",
        sizes[size],
        on
          ? "bg-copper shadow-glow"
          : "bg-ink-3 shadow-[inset_0_1px_2px_rgb(0_0_0/.8)]",
        on && pulse && "animate-[status-pulse_2.4s_ease-in-out_infinite]",
        !label && className,
      )}
    />
  );

  if (!label) return dot;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {dot}
      <span>{label}</span>
    </span>
  );
}
