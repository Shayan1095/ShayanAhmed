"use client";

import * as m from "motion/react-m";
import { AnimatePresence, useDragControls } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SALogo } from "@/components/brand/sa-logo";
import { useSmoothScroll } from "@/components/providers/smooth-scroll";
import { gsap, lazyMorphSVG, lazyScrambleText, MQ, ScrollTrigger, useGSAP, whenIdle } from "@/lib/gsap";
import { easeOutExpo, motionGrammar } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Clock } from "./clock";
import { chapters, navLinks, sectionHref, type ChapterId, type NavId, type NavProject } from "./nav-links";

type NavbarProps = {
  onHome: boolean;
  /** On /work or a case study: "Work" stays lit and links to the work page. */
  onWork?: boolean;
  /** What the readout says when no homepage chapter is in view. */
  place?: string;
  email?: string;
  linkedin?: string;
  /** Featured projects for the Work preview and the phone menu's latest-project card. */
  projects?: NavProject[];
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
 * Navbar (DESIGN.md §7). Always visible; compacts after the top, copper progress line.
 *  - Links sit directly on the bar. The section in view glows copper, with a
 *    dot that springs from link to link; hovering draws a hairline underline.
 *  - The bar stays put while you scroll (it never hides).
 *  - A readout under the name says where you are ("Process"),
 *    scrambling to each new chapter (GSAP ScrambleText).
 *  - Once you scroll, the bar slims into frosted glass (solid on low-power devices).
 *  - Hovering or focusing Work opens a preview of the featured case studies.
 */
export function Navbar({ onHome, onWork = false, place, email, linkedin, projects = [] }: NavbarProps) {
  const progress = useRef<HTMLSpanElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [compact, setCompact] = useState(false);
  const [chapter, setChapter] = useState<ChapterId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Work preview: opens on hover or focus; closing waits a beat so the pointer can travel into it.
  const [preview, setPreview] = useState(false);
  const closeTimer = useRef(0);
  const skipFocusOpen = useRef(false);
  const openPreview = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setPreview(true);
  }, []);
  const closePreviewSoon = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setPreview(false), 160);
  }, []);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);
  const previewOpen = preview;

  const navIds = navLinks.map((l) => l.id) as readonly string[];
  const active: NavId | null = onWork ? "work" : chapter && navIds.includes(chapter) ? (chapter as NavId) : null;

  // Scroll-driven state. GSAP owns scroll; the bar itself moves with CSS transitions.
  useGSAP(
    () => {
      const setProgress = gsap.quickSetter(progress.current, "scaleX");
      let compactNow = false;

      // Runs every scroll frame: only touch React state when a value actually flips.
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const y = self.scroll();
          setProgress(self.progress);
          const c = y > 60;
          if (c !== compactNow) setCompact((compactNow = c));
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
  // The readout's scramble and the menu icon's morph load while the page is idle.
  useEffect(
    () =>
      whenIdle(() => {
        void lazyScrambleText.load();
        void lazyMorphSVG.load();
      }),
    [],
  );
  useGSAP(
    () => {
      const el = readout.current;
      if (!el) return;
      // Until the scramble plugin has arrived, the text just changes.
      if (window.matchMedia(MQ.reduce).matches || el.textContent === readoutText || !lazyScrambleText.get()) {
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
          // Own layer: the page scrolls under it without repainting it.
          // The same bar on every screen; phones get the menu button instead of the links.
          "fixed inset-x-0 top-[env(safe-area-inset-top)] z-70 transition-[transform,padding] duration-500 ease-out-expo will-change-transform",
          compact ? "py-2" : "py-3.5",
        )}
      >
        <div className="wrap">
          <div
            className={cn(
              "relative mx-auto flex items-center justify-between gap-4 rounded-card pl-3 pr-2 transition-[max-width,padding,background-color,box-shadow,border-color] duration-500 ease-out-expo",
              compact ? "nav-glass max-w-[1120px] py-1.5" : "raised max-w-[1600px] py-2",
            )}
          >
            <Link href="/" className="flex min-h-11 items-center gap-3">
              <SALogo size={38} aria-hidden="true" className="shrink-0" />
              <span className="flex flex-col leading-tight">
                <span className="font-display text-[15px] font-bold">Shayan Ahmed</span>
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

            <nav aria-label="Main" className="hidden min-[900px]:block">
              <ul className="relative flex items-center gap-1">
                {navLinks.map((l) => {
                  const current = active === l.id;
                  const href = l.id === "work" && onWork ? "/work" : sectionHref(l.id, onHome);
                  const isWork = l.id === "work" && projects.length > 0;
                  return (
                    <li
                      key={l.id}
                      className="relative"
                      {...(isWork && {
                        onMouseEnter: openPreview,
                        onMouseLeave: closePreviewSoon,
                        onFocus: () => {
                          // Focus returning to Work after Escape must not reopen the preview.
                          if (skipFocusOpen.current) skipFocusOpen.current = false;
                          else openPreview();
                        },
                        onBlur: (e: React.FocusEvent) => !e.currentTarget.contains(e.relatedTarget as Node) && setPreview(false),
                        onKeyDown: (e: React.KeyboardEvent) => {
                          if (e.key === "Escape" && previewOpen) {
                            setPreview(false);
                            skipFocusOpen.current = true;
                            (e.currentTarget.querySelector("a") as HTMLElement | null)?.focus();
                          }
                        },
                      })}
                    >
                      <a
                        href={href}
                        aria-current={current ? (onWork ? "page" : "location") : undefined}
                        {...(isWork && { "aria-expanded": previewOpen, "aria-controls": "work-preview" })}
                        className={cn(
                          "group/link relative block px-3.5 py-2.5 text-sm font-medium transition-[color,text-shadow] duration-500 ease-out-expo",
                          current ? "nav-glow" : "text-muted hover:text-ink focus-visible:text-ink",
                        )}
                      >
                        {l.label}
                        {/* Hover: a hairline draws in from the left. */}
                        {!current && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-3.5 bottom-1.5 h-px origin-left scale-x-0 bg-ink/40 transition-transform duration-500 ease-out-expo group-hover/link:scale-x-100 group-focus-visible/link:scale-x-100"
                          />
                        )}
                        {/* Where you are: a copper dot that springs from link to link. */}
                        {current && (
                          <m.span
                            layoutId="nav-dot"
                            aria-hidden="true"
                            className="absolute bottom-0 left-1/2 size-[5px] -translate-x-1/2 rounded-full bg-copper shadow-glow"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </a>
                      {isWork && <WorkPreview open={previewOpen} projects={projects} />}
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-4">
              <div className="hidden min-[900px]:inline-flex">
                <a
                  href={sectionHref("contact", onHome)}
                  className="group/cta relative inline-flex min-h-[46px] items-center gap-2 overflow-hidden rounded-control bg-[linear-gradient(180deg,var(--ink-key-top,#2a2826),var(--ink-key-bottom,var(--color-ink)))] px-5 text-[15px] font-semibold text-paper shadow-[inset_0_1px_0_rgb(255_255_255/.14),0_2px_0_#000,0_12px_24px_-10px_rgb(17_17_17/.6)] transition-transform duration-100 active:translate-y-0.5"
                >
                  Start a project
                  {/* The arrow slips out and a fresh one slides in on hover/focus. */}
                  <span aria-hidden="true" className="relative inline-block w-[1em] overflow-hidden">
                    <span className="block transition-transform duration-[450ms] ease-out-expo group-hover/cta:translate-x-full group-focus-visible/cta:translate-x-full">
                      →
                    </span>
                    <span className="absolute inset-0 block -translate-x-full text-copper transition-transform duration-[450ms] ease-out-expo group-hover/cta:translate-x-0 group-focus-visible/cta:translate-x-0">
                      →
                    </span>
                  </span>
                </a>
              </div>
              {/* Phones and small tablets: the menu (a sheet with every chapter, contact and Start). */}
              <button
                ref={menuButton}
                type="button"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={() => setMenuOpen(true)}
                className="inset-track inline-flex size-[46px] items-center justify-center rounded-control transition-transform duration-[120ms] active:scale-[0.94] min-[900px]:hidden"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 text-ink">
                  <path d={MENU_PATH} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Progress line, clipped to the bar's rounded corners. */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-card">
              <span ref={progress} className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-copper shadow-glow will-change-transform" />
            </span>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={closeMenu}
        onHome={onHome}
        onWork={onWork}
        active={active}
        email={email}
        linkedin={linkedin}
        latest={projects[0]}
        returnFocus={menuButton}
      />
    </>
  );
}

/**
 * Menu link text that rises in letter by letter, each letter from behind its
 * own mask. The real word is read once by screen readers (the letters are
 * hidden from them); reduced motion shows the word at once (site-wide Motion setting).
 */
function LetterReveal({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span className="inline-flex">
      <span className="sr-only">{text}</span>
      {Array.from(text).map((ch, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.06em] align-bottom">
          <m.span
            className="inline-block"
            initial={{ y: "105%" }}
            animate={{ y: "0%" }}
            transition={{ delay: delay + i * 0.028, duration: 0.65, ease: easeOutExpo }}
          >
            {ch === " " ? " " : ch}
          </m.span>
        </span>
      ))}
    </span>
  );
}

/** A project's screenshot, or its initials on an ink tile until screenshots are added. */
function ProjectThumb({ project, className }: { project: NavProject; className?: string }) {
  return (
    <span className={cn("tone-ink relative block overflow-hidden rounded-lg bg-ink", className)}>
      {project.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- small preview; next/image adds nothing here
        <img
          src={project.image.src}
          alt=""
          width={project.image.width}
          height={project.image.height}
          loading="lazy"
          className="absolute inset-0 size-full object-cover object-top transition-transform duration-700 ease-out-expo group-hover/card:scale-[1.04]"
        />
      ) : (
        // Until screenshots are added: the project's initials, drawn like a mark.
        <span
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center bg-[radial-gradient(80%_70%_at_50%_0%,rgb(201_133_63/.22),transparent_70%)] font-display text-[26px] font-black tracking-[-0.03em] text-copper"
        >
          {project.title
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase()}
        </span>
      )}
    </span>
  );
}

/** Featured case studies under the Work link: one move from the navbar to your proof. */
function WorkPreview({ open, projects }: { open: boolean; projects: NavProject[] }) {
  return (
    <AnimatePresence>
      {open && (
        <m.div
          id="work-preview"
          role="region"
          aria-label="Featured work"
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.18 } }}
          transition={{ duration: 0.45, ease: easeOutExpo }}
          // The top padding bridges the gap, so the pointer can travel from the link into the panel.
          className="absolute left-[-6px] top-full z-10 w-[min(600px,calc(100vw-48px))] origin-top-left pt-3"
        >
          <div className="nav-glass rounded-card p-2.5">
            <ul className="grid grid-cols-2 gap-2.5">
              {projects.map((p, i) => (
                <m.li
                  key={p.slug}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + i * 0.05, duration: 0.45, ease: easeOutExpo }}
                >
                  <Link href={p.href} className="group/card flex h-full flex-col gap-2.5 rounded-[12px] p-2 transition-colors hover:bg-paper-edge/25 focus-visible:bg-paper-edge/25">
                    <ProjectThumb project={p} className="aspect-[16/10] w-full" />
                    <span className="px-0.5">
                      <span className="block font-display text-[15px] font-extrabold leading-tight">
                        {p.title}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-muted">{p.line}</span>
                    </span>
                  </Link>
                </m.li>
              ))}
            </ul>
            <Link
              href="/work"
              className="group/all mt-1 flex items-center justify-between rounded-[10px] px-3 py-2 text-[13px] font-semibold text-ink hover:bg-paper-edge/25"
            >
              All work
              <span aria-hidden="true" className="transition-transform duration-300 ease-out-expo group-hover/all:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </m.div>
      )}
    </AnimatePresence>
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
  email,
  linkedin,
  latest,
  returnFocus,
}: {
  open: boolean;
  onClose: () => void;
  onHome: boolean;
  onWork: boolean;
  active: NavId | null;
  email?: string;
  linkedin?: string;
  latest?: NavProject;
  returnFocus: React.RefObject<HTMLButtonElement | null>;
}) {
  const { stop, start } = useSmoothScroll();
  const dialog = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const icon = useRef<SVGPathElement>(null);
  const drag = useDragControls();

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
      if (!open || !icon.current || !lazyMorphSVG.get() || window.matchMedia(MQ.reduce).matches) return;
      gsap.fromTo(
        icon.current,
        { morphSVG: MENU_PATH },
        { morphSVG: CLOSE_PATH, duration: 0.6, delay: 0.15, ease: motionGrammar.easeToggle },
      );
    },
    { dependencies: [open] },
  );

  const links = [...navLinks, { id: "contact", label: "Contact" } as const];
  const contacts = [
    email && { label: "Email", href: `mailto:${email}`, text: email },
    linkedin && { label: "LinkedIn", href: linkedin, text: linkedin.replace(/^https?:\/\/(www\.)?/, "") },
  ].filter(Boolean) as { label: string; href: string; text: string }[];

  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="menu-backdrop"
          aria-hidden="true"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.26 }}
          className="fixed inset-0 z-[74] bg-black/60"
        />
      )}
      {open && (
        <m.div
          key="menu-sheet"
          ref={dialog}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          // A bottom sheet: slides up, and a swipe down on the handle closes it.
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
          data-lenis-prevent=""
          className="tone-ink fixed inset-x-0 bottom-0 z-75 flex max-h-[92svh] flex-col gap-6 overflow-y-auto overscroll-contain rounded-t-[28px] bg-ink px-[max(20px,env(safe-area-inset-right))] pb-[calc(env(safe-area-inset-bottom)+24px)] pt-2 text-paper shadow-[0_-20px_50px_-10px_rgb(0_0_0/.6),inset_0_1px_0_rgb(232_178_122/.18)]"
        >
          {/* Grab handle: drag it down (or tap the backdrop) to close. */}
          <div
            onPointerDown={(e) => drag.start(e)}
            className="-mx-5 flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
          >
            <span aria-hidden="true" className="h-1.5 w-11 rounded-full bg-paper/25" />
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3 font-display text-[15px] font-bold">
              <SALogo size={38} aria-hidden="true" className="shrink-0" />
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
                  <li key={l.id}>
                    <a
                      href={href}
                      onClick={onClose}
                      aria-current={current ? "location" : undefined}
                      className="group flex items-baseline gap-4 py-1"
                    >
                      <span
                        className={cn(
                          "font-display text-[44px] font-extrabold uppercase leading-[1.05] tracking-[-0.03em]",
                          current && "text-copper",
                        )}
                      >
                        <LetterReveal text={l.label} delay={0.14 + i * 0.04} />
                      </span>
                      {current && (
                        <span aria-hidden="true" className="ml-auto size-2 self-center rounded-full bg-copper shadow-glow" />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
          {latest && (
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: easeOutExpo }}
            >
            <Link
              href={latest.href}
              onClick={onClose}
              className="group/card flex items-center gap-3.5 rounded-card bg-ink-2 p-2.5 pr-4 shadow-ink-raised"
            >
              <ProjectThumb project={latest} className="aspect-[16/10] w-24 shrink-0" />
              <span className="min-w-0">
                <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-ink">Latest project</span>
                <span className="block truncate font-display text-[17px] font-extrabold">{latest.title}</span>
                <span className="block truncate text-[13px] text-muted-ink">{latest.line}</span>
              </span>
              <span aria-hidden="true" className="ml-auto text-copper transition-transform duration-300 ease-out-expo group-hover/card:translate-x-1">
                →
              </span>
            </Link>
            </m.div>
          )}
          <div className="mt-auto flex flex-col gap-3.5 font-mono text-xs tracking-[0.08em] text-muted-ink">
            <Clock className="whitespace-nowrap text-[12px]" />
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
            <a
              href={sectionHref("contact", onHome)}
              onClick={onClose}
              className="raised-sm mt-1 inline-flex min-h-12 items-center justify-center rounded-control font-sans text-[15px] font-semibold tracking-normal text-ink"
            >
              Start a project →
            </a>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
