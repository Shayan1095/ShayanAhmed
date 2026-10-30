"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Keycap, StatusLight } from "@/components/system";
import { useSmoothScroll } from "@/components/providers/smooth-scroll";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { easeOutExpo, motionGrammar } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Clock } from "./clock";
import { chapters, navLinks, sectionHref, type ChapterId, type NavId } from "./nav-links";

type NavbarProps = {
  availability: string;
  onHome: boolean;
  /** On /work or a case study: "Work" stays lit and links to the work page. */
  onWork?: boolean;
  /** What the readout says when no homepage chapter is in view. */
  place?: string;
  email?: string;
  linkedin?: string;
};

/** Reads the route (inside the layout's Suspense boundary) and renders the navbar for it. */
export function RouteNavbar(props: Omit<NavbarProps, "onHome" | "onWork" | "place">) {
  const pathname = usePathname();
  const onWork = pathname === "/work" || pathname.startsWith("/work/");
  const place = pathname === "/work" ? "All work" : onWork ? "Case study" : undefined;
  return <Navbar {...props} onHome={pathname === "/"} onWork={onWork} place={place} />;
}

const DEFAULT_PLACE = "Full-stack developer";
const SCRAMBLE_CHARS = "0123456789·ABCDEFGHIJKLMNOPRSTUVWXYZ";

/**
 * Navbar (DESIGN.md §7). Hides on scroll down and returns on scroll up,
 * compacts after the top, copper progress line.
 *  - The raised key marks the section in view and glides to whichever link
 *    you point at or focus (a spring slide, never magnetic).
 *  - A readout under the name says where you are ("04 · Process"),
 *    scrambling to each new chapter (GSAP ScrambleText).
 */
export function Navbar({ availability, onHome, onWork = false, place, email, linkedin }: NavbarProps) {
  const progress = useRef<HTMLSpanElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const [chapter, setChapter] = useState<ChapterId | null>(null);
  const [hover, setHover] = useState<NavId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const navIds = navLinks.map((l) => l.id) as readonly string[];
  const active: NavId | null = onWork ? "work" : chapter && navIds.includes(chapter) ? (chapter as NavId) : null;
  const keyOn = hover ?? active;

  // Scroll-driven state. GSAP owns scroll; the bar itself moves with CSS transitions.
  useGSAP(
    () => {
      const setProgress = gsap.quickSetter(progress.current, "scaleX");
      let lastY = window.scrollY;
      let compactNow = false;
      let hiddenNow = false;

      // Runs every scroll frame: only touch React state when a value actually flips.
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const y = self.scroll();
          setProgress(self.progress);
          const c = y > 60;
          if (c !== compactNow) setCompact((compactNow = c));
          if (Math.abs(y - lastY) > 4) {
            const h = y > lastY && y > 240;
            if (h !== hiddenNow) setHidden((hiddenNow = h));
            lastY = y;
          }
        },
      });

      if (!onHome) return;
      // Scroll spy: the chapter crossing 45% of the viewport is "here".
      for (const { id } of chapters) {
        const el = document.getElementById(id);
        if (!el) continue;
        ScrollTrigger.create({
          trigger: el,
          start: "top 45%",
          end: "bottom 45%",
          onToggle: (self) => {
            if (self.isActive) setChapter(id);
            else setChapter((cur) => (cur === id ? null : cur));
          },
        });
      }
    },
    { dependencies: [onHome] },
  );

  // Readout: scramble to the new chapter name.
  const target = (chapter && chapters.find((c) => c.id === chapter)?.label) || place || DEFAULT_PLACE;
  // React renders only the first value; ScrambleText owns every change after that.
  const [firstReadout] = useState(target);
  // Settle first: ScrollTrigger refreshes (fonts, late pins) can flip chapters for a
  // frame, which would restart the scramble. Only a chapter that holds for 150ms is shown.
  const [readoutText, setReadoutText] = useState(target);
  useEffect(() => {
    const t = window.setTimeout(() => setReadoutText(target), 150);
    return () => window.clearTimeout(t);
  }, [target]);
  useGSAP(
    () => {
      const el = readout.current;
      if (!el) return;
      if (window.matchMedia(MQ.reduce).matches || el.textContent === readoutText) {
        el.textContent = readoutText;
        return;
      }
      gsap.to(el, {
        duration: 0.7,
        ease: "none",
        scrambleText: { text: readoutText, chars: SCRAMBLE_CHARS, speed: 0.7, revealDelay: 0.15 },
        overwrite: true,
      });
    },
    { dependencies: [readoutText] },
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
        className={cn(
          "fixed inset-x-0 top-[env(safe-area-inset-top)] z-70 transition-[transform,padding] duration-500 ease-out-expo",
          compact ? "py-2" : "py-3.5",
          // Comes back whenever something inside it has keyboard focus.
          hidden && !menuOpen && "-translate-y-[130%] focus-within:translate-y-0",
        )}
      >
        <div className="wrap">
          <div className="raised relative flex items-center justify-between gap-4 overflow-hidden rounded-card py-2 pl-3 pr-2">
            <Link href="/" className="flex items-center gap-3">
              <Keycap aria-hidden="true">SA</Keycap>
              <span className="flex flex-col leading-tight">
                <span className="font-display text-[15px] font-bold [font-variation-settings:'wdth'_108]">Shayan Ahmed</span>
                {/* Where you are on the page. Decorative: links carry aria-current. */}
                <span
                  ref={readout}
                  aria-hidden="true"
                  className="mt-0.5 h-[1.2em] whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
                >
                  {firstReadout}
                </span>
              </span>
            </Link>

            <nav aria-label="Main" className="hidden min-[900px]:block" onMouseLeave={() => setHover(null)}>
              <ul className="inset-track relative flex gap-0.5 rounded-control p-1">
                {navLinks.map((l) => {
                  const lit = keyOn === l.id;
                  const current = active === l.id;
                  const href = l.id === "work" && onWork ? "/work" : sectionHref(l.id, onHome);
                  return (
                    <li key={l.id} className="relative">
                      {lit && (
                        <motion.span
                          layoutId="nav-key"
                          aria-hidden="true"
                          className="raised-sm absolute inset-0 rounded-[9px]"
                          transition={{ type: "spring", stiffness: 420, damping: 36, mass: 0.8 }}
                        />
                      )}
                      <a
                        href={href}
                        aria-current={current ? (onWork ? "page" : "location") : undefined}
                        onMouseEnter={() => setHover(l.id)}
                        onFocus={() => setHover(l.id)}
                        onBlur={() => setHover(null)}
                        className={cn(
                          "relative flex items-baseline gap-1.5 rounded-[9px] px-4 py-[9px] text-sm font-medium transition-colors duration-300",
                          lit || current ? "text-ink" : "text-muted hover:text-ink",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "hidden font-mono text-[9.5px] tracking-[0.08em] transition-colors duration-300 min-[1180px]:inline",
                            current ? "text-walnut" : "text-muted",
                          )}
                        >
                          {l.n}
                        </span>
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
              <div className="hidden min-[900px]:inline-flex">
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
              </div>
              <button
                ref={menuButton}
                type="button"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={() => setMenuOpen(true)}
                className="inset-track inline-flex size-[46px] items-center justify-center rounded-control min-[900px]:hidden"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 text-ink">
                  <path d={MENU_PATH} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
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

      <MobileMenu
        open={menuOpen}
        onClose={closeMenu}
        onHome={onHome}
        onWork={onWork}
        active={active}
        availability={availability}
        email={email}
        linkedin={linkedin}
        returnFocus={menuButton}
      />
    </>
  );
}

/** Two bars (menu) and a cross (close): MorphSVG melts one into the other. */
const MENU_PATH = "M4 9h16M4 15h16";
const CLOSE_PATH = "M6 6l12 12M18 6L6 18";

function MobileMenu({
  open,
  onClose,
  onHome,
  onWork,
  active,
  availability,
  email,
  linkedin,
  returnFocus,
}: {
  open: boolean;
  onClose: () => void;
  onHome: boolean;
  onWork: boolean;
  active: NavId | null;
  availability: string;
  email?: string;
  linkedin?: string;
  returnFocus: React.RefObject<HTMLButtonElement | null>;
}) {
  const { stop, start } = useSmoothScroll();
  const dialog = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const icon = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!open) return;
    stop();
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    closeBtn.current?.focus();
    const opener = returnFocus.current;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !dialog.current) return;
      // Keep keyboard focus inside the open menu.
      const items = Array.from(dialog.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      start();
      document.documentElement.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      // Back to the button that opened the menu.
      opener?.focus();
    };
  }, [open, onClose, stop, start, returnFocus]);

  // The close icon arrives as the menu's two bars and melts into a cross.
  useGSAP(
    () => {
      if (!open || !icon.current || window.matchMedia(MQ.reduce).matches) return;
      gsap.fromTo(
        icon.current,
        { morphSVG: MENU_PATH },
        { morphSVG: CLOSE_PATH, duration: 0.6, delay: 0.15, ease: motionGrammar.easeToggle },
      );
    },
    { dependencies: [open] },
  );

  const links = [...navLinks, { id: "contact", n: "08", label: "Contact" } as const];
  const contacts = [
    email && { label: "Email", href: `mailto:${email}`, text: email },
    linkedin && { label: "LinkedIn", href: linkedin, text: linkedin.replace(/^https?:\/\/(www\.)?/, "") },
  ].filter(Boolean) as { label: string; href: string; text: string }[];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dialog}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.55, ease: easeOutExpo }}
          className="tone-ink fixed inset-0 z-75 flex flex-col gap-7 overflow-y-auto bg-ink px-[max(20px,env(safe-area-inset-right))] pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[calc(env(safe-area-inset-top)+24px)] text-paper"
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
              className="ink-inset grid size-[46px] place-items-center rounded-control bg-ink-2 text-paper"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6">
                <path ref={icon} d={CLOSE_PATH} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav aria-label="Mobile" className="mt-3">
            <ul className="flex flex-col gap-1">
              {links.map((l, i) => {
                const current = active === l.id;
                const href = l.id === "work" && onWork ? "/work" : sectionHref(l.id, onHome);
                return (
                  <motion.li
                    key={l.id}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.12 + i * 0.05, duration: 0.6, ease: easeOutExpo }}
                  >
                    <a
                      href={href}
                      onClick={onClose}
                      aria-current={current ? "location" : undefined}
                      className="group flex items-baseline gap-4 py-1"
                    >
                      <span aria-hidden="true" className={cn("w-7 font-mono text-xs tracking-[0.08em]", current ? "text-copper" : "text-muted-ink")}>
                        {l.n}
                      </span>
                      <span
                        className={cn(
                          "font-display text-[44px] font-extrabold uppercase leading-[1.05] tracking-[-0.03em] [font-variation-settings:'wdth'_118]",
                          current && "text-copper",
                        )}
                      >
                        {l.label}
                      </span>
                      {current && (
                        <span aria-hidden="true" className="ml-auto size-2 self-center rounded-full bg-copper shadow-glow" />
                      )}
                    </a>
                  </motion.li>
                );
              })}
            </ul>
          </nav>
          <div className="mt-auto flex flex-col gap-3.5 font-mono text-xs tracking-[0.08em] text-muted-ink">
            {contacts.length > 0 && (
              <ul className="flex flex-col gap-2 border-t border-ink-3 pt-4">
                {contacts.map((c) => (
                  <li key={c.label} className="flex items-baseline gap-3">
                    <span className="w-16 uppercase">{c.label}</span>
                    <a href={c.href} className="truncate font-sans text-[15px] tracking-normal text-paper underline-offset-4 hover:underline">
                      {c.text}
                    </a>
                  </li>
                ))}
              </ul>
            )}
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
