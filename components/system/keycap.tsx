import { cn } from "@/lib/utils";

type KeycapProps = React.ComponentProps<"span"> & {
  tone?: "ink" | "paper";
  /** Presses down 4px on :active (use on real controls only). */
  pressable?: boolean;
};

/** Keyboard keycap, e.g. the SA monogram in the navbar. */
export function Keycap({ tone = "ink", pressable, className, ...props }: KeycapProps) {
  return (
    <span
      className={cn(
        "inline-grid h-9 min-w-[38px] place-items-center rounded-[9px] px-2 font-display text-[13px] font-extrabold leading-none",
        tone === "ink"
          ? "bg-[linear-gradient(180deg,#2c2a27,var(--color-ink))] text-paper shadow-[inset_0_1px_0_rgb(255_255_255/.15),inset_0_-4px_0_#000,0_3px_0_#000,0_6px_10px_-4px_rgb(17_17_17/.5)]"
          : "bg-[linear-gradient(180deg,var(--color-paper-hi),var(--color-paper))] text-ink shadow-keycap",
        pressable && "transition-[transform,box-shadow] duration-75 active:translate-y-1",
        className,
      )}
      {...props}
    />
  );
}
