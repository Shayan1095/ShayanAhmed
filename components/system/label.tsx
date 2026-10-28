import { cn } from "@/lib/utils";

type LabelProps = React.ComponentProps<"span"> & {
  /** Active labels use the band's accent (walnut on cream, copper on ink). */
  accent?: boolean;
};

/** Martian Mono hardware label. Colour follows the band it sits in. */
export function Label({ accent, className, ...props }: LabelProps) {
  return (
    <span
      className={cn("type-label", accent ? "text-tone-accent" : "text-tone-muted", className)}
      {...props}
    />
  );
}
