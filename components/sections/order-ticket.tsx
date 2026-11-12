"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Stamp } from "@/components/system";
import { cn } from "@/lib/utils";

/** The four stations of a real Brands Attire flow. */
const stations = [
  { layer: "Website", title: "Order placed", text: "A customer checks out on the storefront." },
  { layer: "Automation", title: "Risk check", text: "An agent scores the order and flags duplicates." },
  { layer: "System", title: "You approve", text: "One tap from the owner panel.", you: true },
  { layer: "Automation", title: "Dispatched", text: "Courier booked, customer notified." },
] as const;

type Stage = 0 | 1 | 2 | 3; // which station the ticket has reached

/**
 * Services signature (motion spec, Phase 4): one order ticket travels through
 * the system. It drops in, is scanned and stamped FLAGGED at the risk check,
 * waits for your approval, then is stamped DISPATCHED and slides off.
 *
 * Desktop: the section pins and scroll drives the ticket; the approval waits
 * for a click, and approves itself if you keep scrolling.
 * Phones and tablets: no pin; the stations stack down a copper rail, each
 * lights as you reach it, and you tap Approve (or scroll past and it completes).
 * Reduced motion: the four states sit still, already approved.
 */
export function OrderTicket() {
  const root = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<Stage>(0);
  const [approved, setApproved] = useState(false);
  const approvedRef = useRef(false);
  const railFill = useRef<HTMLSpanElement>(null);

  const approve = useCallback(() => {
    if (approvedRef.current) return;
    approvedRef.current = true;
    setApproved(true);
    setStage(3);
  }, []);

  // Reduced motion: show the finished flow at once.
  useEffect(() => {
    if (!window.matchMedia(MQ.reduce).matches) return;
    const t = window.setTimeout(approve, 0);
    return () => window.clearTimeout(t);
  }, [approve]);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();

      // Desktop: pinned stage, the ticket travels across the four stations.
      mm.add(MQ.desktop, () => {
        const ticket = el.querySelector<HTMLElement>("[data-ticket]");
        const lane = el.querySelector<HTMLElement>("[data-lane]");
        const scan = el.querySelector<HTMLElement>("[data-scan]");
        const flag = el.querySelector<HTMLElement>("[data-stamp='flag']");
        if (!ticket || !lane || !scan || !flag) return;
        // Ticket centre over station i (columns are equal quarters of the lane).
        const xAt = (i: number) => (lane.clientWidth / 4) * (i + 0.5) - ticket.offsetWidth / 2;

        gsap.set(ticket, { x: xAt(0), y: -70, opacity: 0, rotate: -3 });
        gsap.set(scan, { yPercent: -100, opacity: 0 });
        gsap.set(flag, { scale: 1.7, opacity: 0, rotate: -14 });

        const tl = gsap.timeline({
          defaults: { ease: "sa.out" },
          scrollTrigger: {
            trigger: el,
            start: "center center",
            // A shorter hold (it used to sit for 1.5 screens with little changing).
            end: () => `+=${window.innerHeight * 1.1}`,
            pin: true,
            anticipatePin: 1,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const p = self.progress;
              const s: Stage = p < 0.22 ? 0 : p < 0.55 ? 1 : 2;
              if (!approvedRef.current) setStage((cur) => (cur === s ? cur : s));
              // Kept scrolling past the approval: it completes by itself.
              if (p > 0.86) approve();
            },
          },
        });
        tl.to(ticket, { y: 0, opacity: 1, rotate: 0, duration: 0.18 }, 0)
          .to(ticket, { x: () => xAt(1), duration: 0.16, ease: "sa.inOut" }, 0.24)
          .to(scan, { opacity: 1, duration: 0.02 }, 0.38)
          .to(scan, { yPercent: 100, duration: 0.12, ease: "none" }, 0.38)
          .to(scan, { opacity: 0, duration: 0.02 }, 0.5)
          .to(flag, { scale: 1, opacity: 1, rotate: -8, duration: 0.06, ease: "back.out(2.4)" }, 0.5)
          .to(ticket, { x: () => xAt(2), duration: 0.16, ease: "sa.inOut" }, 0.58)
          .to({}, { duration: 0.26 }, 0.74);
      });

      // Phones and tablets: stations light as they reach the middle of the screen.
      mm.add("(max-width: 899px) and (prefers-reduced-motion: no-preference)", () => {
        const items = gsap.utils.toArray<HTMLElement>("[data-station]", el);
        // The copper line follows the scroll exactly: its tip sits on the same
        // screen line (62% down) that lights each station, so they move together.
        const rail = railFill.current?.parentElement;
        const fill =
          railFill.current && rail
            ? gsap.fromTo(
                railFill.current,
                { scaleY: 0 },
                { scaleY: 1, ease: "none", scrollTrigger: { trigger: rail, start: "top 62%", end: "bottom 62%", scrub: 0.25 } },
              )
            : null;
        const triggers = items.map((it, i) =>
          ScrollTrigger.create({
            trigger: it,
            // The number badge's centre (22px down) meets the line's tip.
            start: "top+=22 62%",
            onEnter: () => {
              if (i < 3 && !approvedRef.current) setStage((cur) => (i > cur ? (i as Stage) : cur));
            },
          }),
        );
        // Scrolled past the approval without tapping: it completes by itself.
        const past = ScrollTrigger.create({ trigger: items[3], start: "top 45%", onEnter: approve });
        return () => {
          triggers.forEach((t) => t.kill());
          past.kill();
          fill?.scrollTrigger?.kill();
          fill?.kill();
        };
      });
    },
    { scope: root, dependencies: [approve] },
  );

  // After approval on desktop: DISPATCHED stamp, the ticket slides off.
  useGSAP(
    () => {
      if (!approved || !root.current || !window.matchMedia(MQ.desktop).matches) return;
      const ticket = root.current.querySelector<HTMLElement>("[data-ticket]");
      const lane = root.current.querySelector<HTMLElement>("[data-lane]");
      const sent = root.current.querySelector<HTMLElement>("[data-stamp='sent']");
      if (!ticket || !lane || !sent) return;
      const xAt = (lane.clientWidth / 4) * 3.5 - ticket.offsetWidth / 2;
      gsap
        .timeline({ defaults: { ease: "sa.out" } })
        .fromTo(sent, { scale: 1.7, opacity: 0, rotate: 10 }, { scale: 1, opacity: 1, rotate: 6, duration: 0.35, ease: "back.out(2.4)" })
        .to(ticket, { x: xAt, duration: 0.7, ease: "sa.inOut" }, 0.25)
        .to(ticket, { x: xAt + 40, opacity: 0.0, duration: 0.5, ease: "power2.in" }, 1.25);
    },
    { dependencies: [approved], scope: root },
  );

  const lit = (i: number) => (i === 3 ? approved : stage >= i);

  return (
    <div ref={root} className="mb-[72px]">
      {/* Desktop stage */}
      <div className="hidden min-[900px]:block">
        <ol className="relative grid grid-cols-4 gap-[22px]">
          {/* The track the stations sit on; it fills copper as the ticket advances. */}
          <li aria-hidden="true" className="pointer-events-none absolute inset-x-[12.5%] top-[27px] h-px bg-ink-3">
            <span
              // Grows by scaling (no layout work while the stage is pinned).
              className="absolute inset-0 origin-left bg-copper shadow-glow transition-transform duration-500 ease-out-expo"
              style={{ transform: `scaleX(${Math.min(approved ? 3 : stage, 3) / 3})` }}
            />
          </li>
          {stations.map((s, i) => (
            <li key={s.title} className="relative z-[1] flex flex-col items-center gap-3 text-center">
              <span
                className={cn(
                  "grid size-14 place-items-center rounded-2xl bg-[linear-gradient(180deg,#2a2724,var(--color-ink-2))] font-mono text-sm shadow-ink-raised transition-colors duration-500",
                  lit(i) ? "text-copper" : "text-muted-ink",
                )}
              >
                {"you" in s ? (
                  <span
                    aria-hidden="true"
                    className={cn("size-3 rounded-full transition-[background-color,box-shadow] duration-500", lit(i) ? "bg-copper shadow-glow" : "bg-ink-3")}
                  />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <span className="type-label text-[10.5px] text-muted-ink">{s.layer}</span>
              <h3 className={cn("font-display text-[21px] font-extrabold leading-[1.05] transition-colors duration-500", lit(i) ? "text-paper" : "text-paper/45")}>
                {s.title}
              </h3>
              <p className="max-w-[22ch] text-sm text-muted-ink">{s.text}</p>
            </li>
          ))}
        </ol>

        {/* The lane the ticket travels along. */}
        <div data-lane className="relative mt-6 h-[270px]">
          <div data-ticket className="absolute left-0 top-0 w-[260px] will-change-transform">
            <Ticket approved={approved} waiting={stage === 2 && !approved} onApprove={approve} />
          </div>
        </div>
      </div>

      {/* Phones and tablets: stations down a rail. */}
      <ol className="relative flex flex-col gap-3 min-[900px]:hidden">
        <li aria-hidden="true" className="pointer-events-none absolute bottom-6 left-[22px] top-6 w-px bg-ink-3">
          {/* Full without JS or with reduced motion; scroll-scrubbed otherwise (above). */}
          <span ref={railFill} className="absolute inset-0 origin-top bg-copper shadow-glow will-change-transform" />
        </li>
        {stations.map((s, i) => (
          <li key={s.title} data-station className="relative z-[1] flex gap-3">
            <span
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-xl bg-[linear-gradient(180deg,#2a2724,var(--color-ink-2))] font-mono text-sm shadow-ink-raised transition-colors duration-500",
                lit(i) ? "text-copper" : "text-muted-ink",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div
              className={cn(
                // overflow-hidden: the stamp waits enlarged before it lands; keep it inside the card.
                "flex-1 overflow-hidden rounded-[16px] bg-ink-2 px-4 py-3.5 shadow-ink-raised transition-opacity duration-500",
                lit(i) ? "opacity-100" : "opacity-60",
              )}
            >
              <span className="type-label text-[10.5px] text-muted-ink">{s.layer}</span>
              <h3 className="mb-1 mt-1.5 font-display text-[20px] font-extrabold leading-[1.05]">{s.title}</h3>
              <p className="text-[15px] text-muted-ink">{s.text}</p>
              {i === 1 && <Stamp kind="flag" show={stage >= 1} className="mt-3" />}
              {i === 2 &&
                (approved ? (
                  <p className="mt-3 font-mono text-[13px] text-copper">› Approved</p>
                ) : (
                  <button
                    type="button"
                    onClick={approve}
                    className="approve-pulse mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-copper px-5 text-[15px] font-bold text-[#140d08] active:scale-[0.97]"
                  >
                    Approve dispatch
                  </button>
                ))}
              {i === 3 && <Stamp kind="sent" show={approved} className="mt-3" />}
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-7 text-[14.5px] text-muted-ink max-[899px]:hidden">
        A real flow from the Brands Attire build. Every system I deliver follows this shape: agents prepare, you decide.
      </p>
    </div>
  );
}

/** The cream order ticket (example data, as in the Brands Attire owner panel). */
function Ticket({ approved, waiting, onApprove }: { approved: boolean; waiting: boolean; onApprove: () => void }) {
  return (
    <div className="ticket relative overflow-hidden rounded-[10px] bg-[#f3eadb] px-5 pb-4 pt-4 text-[#1a1511] shadow-[0_18px_34px_-14px_rgb(0_0_0/.8)]">
      <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.12em]">
        <span>Order #1042</span>
        <span className="text-[#8a7b66]">COD</span>
      </div>
      <div className="my-3 border-t border-dashed border-[#c8b9a2]" />
      <ul className="space-y-1 font-mono text-[12px]">
        <li className="flex justify-between">
          <span>Linen shirt × 2</span>
          <span>7,980</span>
        </li>
        <li className="flex justify-between text-[#8a7b66]">
          <span>Ship to</span>
          <span>same as #1039</span>
        </li>
      </ul>
      {/* The stamp strip: FLAGGED lands top left, DISPATCHED bottom right, never over the order text. */}
      <div className="relative my-2 h-[76px]">
        <Stamp kind="flag" desktop className="absolute left-0 top-1" />
        <Stamp kind="sent" desktop className="absolute bottom-1 right-0" />
      </div>
      <div className="min-h-11">
        {waiting ? (
          <button
            type="button"
            onClick={onApprove}
            className="approve-pulse inline-flex min-h-11 w-full items-center justify-center rounded-[8px] bg-[#1a1511] text-[14px] font-bold text-[#f3eadb] active:scale-[0.97]"
          >
            Approve dispatch
          </button>
        ) : (
          <p className="pt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[#8a7b66]">{approved ? "› Approved by owner" : "› Checking…"}</p>
        )}
      </div>
      {/* Scan line passing over the ticket at the risk check. */}
      <span
        data-scan
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,transparent_0%,rgb(201_133_63/.25)_46%,rgb(232_178_122/.9)_50%,transparent_54%)] opacity-0"
      />
    </div>
  );
}

/** Rubber stamps: FLAGGED (risk check) and DISPATCHED (after approval). */
