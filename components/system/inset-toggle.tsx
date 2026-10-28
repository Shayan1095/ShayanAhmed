"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export type ToggleOption<T extends string> = { value: T; label: React.ReactNode };

type InsetToggleProps<T extends string> = {
  options: readonly ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the group, e.g. "Filter projects". */
  label: string;
  className?: string;
};

/**
 * Segmented control in an inset track. The raised active key slides between
 * options with a Motion layout animation (DESIGN.md §5).
 */
export function InsetToggle<T extends string>({ options, value, onChange, label, className }: InsetToggleProps<T>) {
  const keyId = useId();
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inset-track relative inline-flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-control p-1", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative min-h-11 shrink-0 cursor-pointer rounded-[9px] px-[15px] text-[13.5px] font-medium transition-colors duration-200",
              active ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={keyId}
                aria-hidden="true"
                className="raised-sm absolute inset-0 rounded-[9px]"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
