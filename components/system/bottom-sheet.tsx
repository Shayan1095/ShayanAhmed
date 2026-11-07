"use client";

import { AnimatePresence, motion, useDragControls } from "motion/react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSmoothScroll } from "@/components/providers/smooth-scroll";
import { easeOutExpo } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A bottom sheet for phones (motion spec): slides up over a dimmed backdrop;
 * drag the handle down, tap the backdrop or press Escape to close. Keyboard
 * focus stays inside while it is open and returns to the opener afterwards;
 * the page behind does not scroll. Rendered into <body> (a portal), so no
 * section's containment (content-visibility, transforms) can trap it.
 */
export function BottomSheet({
  open,
  onClose,
  label,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { stop, start } = useSmoothScroll();
  const panel = useRef<HTMLDivElement>(null);
  const drag = useDragControls();

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    stop();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    // Focus the panel itself first, so screen readers start at the top.
    const t = window.setTimeout(() => panel.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex='0']"));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
      start();
      opener?.focus();
    };
  }, [open, onClose, stop, start]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="sheet-backdrop"
          aria-hidden="true"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.26 }}
          className="fixed inset-0 z-[80] bg-black/60"
        />
      )}
      {open && (
        <motion.div
          key="sheet-panel"
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.5, ease: easeOutExpo }}
          drag="y"
          dragControls={drag}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.7 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 110 || info.velocity.y > 600) onClose();
          }}
          className={cn(
            "fixed inset-x-0 bottom-0 z-[81] flex max-h-[88svh] flex-col overflow-y-auto overscroll-contain rounded-t-[28px] bg-paper-hi px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] text-ink shadow-[0_-20px_50px_-10px_rgb(0_0_0/.6),inset_0_1px_0_rgb(232_178_122/.18)] outline-none",
            className,
          )}
        >
          <div
            onPointerDown={(e) => drag.start(e)}
            className="sticky top-0 z-10 -mx-5 flex h-8 shrink-0 cursor-grab touch-none items-center justify-center bg-paper-hi active:cursor-grabbing"
          >
            <span aria-hidden="true" className="h-1.5 w-11 rounded-full bg-ink/25" />
          </div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
