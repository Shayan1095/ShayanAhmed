"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Keycap, Magnet, StatusLight } from "@/components/system";
import { useSmoothScroll } from "@/components/providers/smooth-scroll";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { easeOutExpo } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Clock } from "./clock";
import { navLinks, sectionHref, type NavId } from "./nav-links";

/**
 * Navbar (DESIGN.md §7). Hides on scroll down and returns on scroll up,
 * compacts after the top, copper progress line, scroll-spy key in an inset track.
 */
export function Navbar({ availability }: { availability: string }) {
  const onHome = usePathname() === "/";
  const header = useRef<HTMLElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [active, setActive] = useState<NavId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Scroll-driven state. GSAP owns scroll; the bar itself moves with CSS transitions.
  useGSAP(
    () => {
      const setProgress = gsap.quickSetter(progress.current, "scaleX");
      let lastY = window.scrollY;

      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const y = self.scroll();
          setProgress(self.progress);
          setCompact(y > 60);
          if (Math.abs(y - lastY) > 4) {
            setHidden(y > lastY && y > 240);
            lastY = y;
          }
        },
      });

      if (!onHome) return;
      // Scroll spy: the section crossing 45% of the viewport is active. Contact clears it.
      const ids: NavId[] = ["services", "work", "about"];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        ScrollTrigger.create({
          trigger: el,
          start: "top 45%",
          end: "bottom 45%",
          onToggle: (self) => {
            if (self.isActive) setActive(id);
            else setActive((cur) => (cur === id ? null : cur));
          },
        });
      }
    },
    { dependencies: [onHome] },
  );

  return (
    <>
      <a
        href="#main"
        className="raised-sm fixed left-4 top-4 z-[100] -translate-y-24 rounded-control px-4 py-3 text-sm font-semibold focus:translate-y-0"
      >
        Skip to content
      </a>
      <header
        ref={header}
        className={cn(
          "fixed inset-x-0 top-[env(safe-area-inset-top)] z-70 transition-[transform,padding] duration-500 ease-out-expo",
          compact ? "py-2" : "py-3.5",
          hidden && !menuOpen && "-translate-y-[130%]",
        )}
      >
        <div className="wrap">
          <div className="raised relative flex items-center justify-between gap-4 overflow-hidden rounded-card py-2 pl-3 pr-2">
            <Link href="/" className="flex items-center gap-3 font-display text-[15px] font-bold [font-variation-settings:'wdth'_108]">
              <Keycap aria-hidden="true">SA</Keycap>
              Shayan Ahmed
            </Link>

            <nav aria-label="Main" className="hidden min-[900px]:block">
              <ul className="inset-track relative flex gap-0.5 rounded-control p-1">
                {navLinks.map((l) => {
                  const on = active === l.id;
                  return (
                    <li key={l.id} className="relative">
                      {on && (
                        <motion.span
                          layoutId="nav-key"
                          aria-hidden="true"
                          className="raised-sm absolute inset-0 rounded-[9px]"
                          transition={{ type: "spring", stiffness: 400, damping: 34 }}
                        />
                      )}
                      <a
                        href={sectionHref(l.id, onHome)}
                        aria-current={on ? "location" : undefined}
                        className={cn(
                          "relative block rounded-[9px] px-4 py-[9px] text-sm font-medium transition-colors",
                          on ? "text-ink" : "text-muted hover:text-ink",
                        )}
                      >
                        {l.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-4">
              <div className="hidden flex-col items-end gap-px leading-tight min-[900px]:flex">
                <StatusLight label={availability} className="text-[13px] font-semibold" />
                <Clock className="font-mono text-[10px] tracking-[0.1em] text-muted" />
              </div>
              <Magnet className="hidden min-[900px]:inline-flex">
                <a
                  href={sectionHref("contact", onHome)}
                  className="group/cta relative inline-flex min-h-[46px] flex-col items-center justify-center overflow-hidden rounded-control bg-[linear-gradient(180deg,#2a2826,var(--color-ink))] px-5 text-[15px] font-semibold text-paper shadow-[inset_0_1px_0_rgb(255_255_255/.14),0_2px_0_#000,0_12px_24px_-10px_rgb(17_17_17/.6)] transition-transform duration-100 active:translate-y-0.5"
                >
                  <span className="block transition-transform duration-[450ms] ease-out-expo group-hover/cta:-translate-y-[140%] group-focus-visible/cta:-translate-y-[140%]">
                    Start a project →
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-full text-center font-mono text-[11px] leading-[46px] tracking-[0.08em] text-copper transition-transform duration-[450ms] ease-out-expo group-hover/cta:-translate-y-full group-focus-visible/cta:-translate-y-full"
                  >
                    Reply within 24h
                  </span>
                </a>
              </Magnet>
              <button
                type="button"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={() => setMenuOpen(true)}
                className="inset-track inline-flex size-[46px] flex-col items-center justify-center gap-[5px] rounded-control min-[900px]:hidden"
              >
                <i className="block h-0.5 w-[18px] rounded bg-ink" />
                <i className="block h-0.5 w-[18px] rounded bg-ink" />
              </button>
            </div>

            <span
              ref={progress}
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-copper shadow-glow"
            />
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} onHome={onHome} availability={availability} />
    </>
  );
}

function MobileMenu({
  open,
  onClose,
  onHome,
  availability,
}: {
  open: boolean;
  onClose: () => void;
  onHome: boolean;
  availability: string;
}) {
  const { stop, start } = useSmoothScroll();
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    stop();
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      start();
      document.documentElement.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, stop, start]);

  const links = [...navLinks, { id: "contact", label: "Contact" }];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.55, ease: easeOutExpo }}
          className="tone-ink fixed inset-0 z-75 flex flex-col gap-7 bg-ink px-[max(20px,env(safe-area-inset-right))] pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[calc(env(safe-area-inset-top)+24px)] text-paper"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3 font-display text-[15px] font-bold [font-variation-settings:'wdth'_108]">
              <Keycap tone="paper" aria-hidden="true">
                SA
              </Keycap>
              Shayan Ahmed
            </span>
            <button
              ref={closeBtn}
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="ink-inset size-[46px] rounded-control bg-ink-2 text-[22px] text-paper"
            >
              ×
            </button>
          </div>
          <nav aria-label="Mobile" className="mt-5">
            <ul className="flex flex-col gap-1.5">
              {links.map((l, i) => (
                <motion.li
                  key={l.id}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.12 + i * 0.05, duration: 0.6, ease: easeOutExpo }}
                >
                  <a
                    href={sectionHref(l.id, onHome)}
                    onClick={onClose}
                    className="block font-display text-[44px] font-extrabold uppercase leading-[1.05] tracking-[-0.03em] [font-variation-settings:'wdth'_118]"
                  >
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto flex flex-col gap-3.5 font-mono text-xs tracking-[0.08em] text-muted-ink">
            <StatusLight label={availability} />
            <Clock />
            <a
              href={sectionHref("contact", onHome)}
              onClick={onClose}
              className="raised-sm mt-1 inline-flex min-h-12 items-center justify-center rounded-control font-sans text-[15px] font-semibold tracking-normal text-ink"
            >
              Start a project →
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
