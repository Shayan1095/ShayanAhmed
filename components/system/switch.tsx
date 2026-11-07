"use client";

import * as m from "motion/react-m";
import { useId } from "react";
import { pressSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { StatusLight } from "./status-light";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Visible label, e.g. "Orders". */
  label: React.ReactNode;
  /** Show a mini status light that turns on with the switch. */
  light?: boolean;
  className?: string;
};

/** Physical toggle switch: the lever slides along an inset slot with a spring. */
export function Switch({ checked, onCheckedChange, label, light = true, className }: SwitchProps) {
  const id = useId();
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className="inset-track relative flex h-8 w-[58px] shrink-0 cursor-pointer items-center rounded-full p-[3px]"
      >
        <m.span
          aria-hidden="true"
          animate={{ x: checked ? 26 : 0 }}
          transition={pressSpring}
          initial={false}
          className="raised-sm grid h-[26px] w-[26px] place-items-center rounded-full"
        >
          <span className="flex gap-[2px]">
            <i className="block h-2.5 w-px bg-paper-edge" />
            <i className="block h-2.5 w-px bg-paper-edge" />
          </span>
        </m.span>
      </button>
      <label htmlFor={id} className="type-label flex cursor-pointer items-center gap-2 text-tone-fg">
        {light && <StatusLight on={checked} size="sm" pulse={false} />}
        {label}
      </label>
    </div>
  );
}
