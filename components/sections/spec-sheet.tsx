"use client";

import { useRef, useState } from "react";
import { Label, StatusLight, TypeText } from "@/components/system";
import { MQ, ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";

/** About spec sheet: label/value rows that type in once on enter. Only true values. */
export function SpecSheet({ rows }: { rows: { label: string; value: string }[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [trigger, setTrigger] = useState(0);

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
    <div ref={root} className="raised rounded-[18px] px-[22px] py-1.5">
      <div className="flex items-center justify-between border-b border-paper-edge pb-2.5 pt-3.5">
        <Label>Spec sheet</Label>
        <Label className="flex items-center gap-2">
          <StatusLight size="sm" pulse={false} on={false} />
          SA-01
        </Label>
      </div>
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
    </div>
  );
}
