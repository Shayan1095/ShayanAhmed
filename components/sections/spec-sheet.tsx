"use client";

import { useEffect, useRef, useState } from "react";
import { Label, StatusLight, TypeText } from "@/components/system";
import { MQ, ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";

/**
 * About spec sheet: label/value rows that type in once on enter. Only true values.
 * It folds (a native <details>): open by default, so it reads fine without JS;
 * on phones it starts closed to keep the page short, and opening it types the
 * rows in again.
 */
export function SpecSheet({ rows }: { rows: { label: string; value: string }[] }) {
  const root = useRef<HTMLDetailsElement>(null);
  const [trigger, setTrigger] = useState(0);

  // Phones: fold it after hydration (it sits far below the first screen, so nothing visible moves).
  useEffect(() => {
    if (root.current && window.matchMedia("(max-width: 767px)").matches) root.current.open = false;
  }, []);

  useGSAP(
    () => {
      gsap.matchMedia().add(MQ.motion, () => {
        ScrollTrigger.create({
          trigger: root.current,
          start: "top 82%",
          once: true,
          onEnter: () => setTrigger(1),
        });
      });
    },
    { scope: root },
  );

  if (rows.length === 0) return null;

  return (
    <details
      ref={root}
      open
      onToggle={(e) => e.currentTarget.open && setTrigger((t) => t + 1)}
      className="group/spec raised rounded-[18px] px-[22px] py-1.5"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 pb-2.5 pt-3.5 group-open/spec:border-b group-open/spec:border-paper-edge [&::-webkit-details-marker]:hidden">
        <Label>Spec sheet</Label>
        <span className="flex items-center gap-3">
          <Label className="flex items-center gap-2">
            <StatusLight size="sm" pulse={false} on={false} />
            SA-01
          </Label>
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-full bg-paper-lo text-[17px] leading-none text-copper transition-transform duration-[260ms] ease-out-expo group-open/spec:rotate-45"
          >
            +
          </span>
        </span>
      </summary>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)]">
        {rows.map((r, i) => {
          const rule = i < rows.length - 1 ? "border-b border-paper-edge" : "";
          return (
            <div key={r.label} className="contents">
              <dt className={`type-label py-[11px] pr-6 pt-[13px] text-[10.5px] tracking-[0.12em] text-muted ${rule}`}>
                {r.label}
              </dt>
              <TypeText
                as="dd"
                text={r.value}
                trigger={trigger}
                delay={i * 60}
                caret={false}
                className={`min-w-0 py-[11px] text-[15px] font-medium [overflow-wrap:anywhere] ${rule}`}
              />
            </div>
          );
        })}
      </dl>
    </details>
  );
}
