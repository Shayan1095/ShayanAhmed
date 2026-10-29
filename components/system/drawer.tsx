"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";
import { easeOutExpo } from "@/lib/motion";
import { cn } from "@/lib/utils";

type DrawerProps = {
  question: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Heading level wrapping the button, for document outline and FAQ markup. */
  headingLevel?: "h3" | "h4";
  className?: string;
};

/**
 * FAQ row with a recessed handle. The answer is always in the HTML (search
 * engines and no-JS visitors can read it); Motion animates the height.
 */
export function Drawer({ question, children, defaultOpen = false, headingLevel: H = "h3", className }: DrawerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const btnId = `${id}-q`;
  const bodyId = `${id}-a`;

  return (
    <div
      className={cn(
        "rounded-card bg-[linear-gradient(180deg,var(--color-paper-hi),var(--color-paper))] shadow-[var(--shadow-raised-sm),0_2px_0_var(--color-paper-edge)]",
        className,
      )}
    >
      <H className="font-sans">
        <button
          id={btnId}
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-[74px] w-full cursor-pointer items-center gap-[18px] px-[22px] py-4 text-left text-[17px] font-semibold leading-snug sm:text-lg"
        >
          <span
            aria-hidden="true"
            className="inset-track relative hidden h-3.5 w-[54px] shrink-0 rounded-[7px] sm:block"
          >
            {/* the handle slides along its track as the drawer is pulled open */}
            <motion.span
              initial={false}
              animate={{ x: open ? 12 : -8, scaleX: open ? 0.7 : 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="absolute inset-x-2.5 top-1 h-1.5 rounded-[3px] bg-[linear-gradient(180deg,var(--color-paper-hi),var(--color-paper-edge))] shadow-[0_1px_2px_rgb(17_17_17/.25)] data-[open=true]:bg-copper"
              data-open={open}
            />
          </span>
          <span className="flex-1">{question}</span>
          <motion.span
            aria-hidden="true"
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.35, ease: easeOutExpo }}
            className="ml-auto font-mono text-xl text-muted"
          >
            +
          </motion.span>
        </button>
      </H>
      <motion.div
        id={bodyId}
        role="region"
        aria-labelledby={btnId}
        data-drawer-body
        initial={false}
        animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: open ? 0.5 : 0.35, ease: open ? easeOutExpo : [0.45, 0, 0.55, 1] }}
        inert={!open}
        className="overflow-hidden"
      >
        <div className="max-w-[46em] px-[22px] pb-6 text-[15.5px] leading-relaxed text-muted sm:pl-[94px]">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
