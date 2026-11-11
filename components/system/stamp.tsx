import { cn } from "@/lib/utils";

export type StampKind = "flag" | "sent" | "approved";

/**
 * The rubber stamp from the order receipt: "Flagged · dup. address" (red),
 * "Dispatched" and "Approved" (green). Phones show "Flagged" only under 400px.
 * `show` false: waiting, enlarged and invisible, so it lands with a press.
 * `desktop`: the pinned receipt animates it with GSAP instead (data-stamp).
 */
export function Stamp({
  kind,
  show = true,
  desktop,
  className,
}: {
  kind: StampKind;
  show?: boolean;
  desktop?: boolean;
  className?: string;
}) {
  const flag = kind === "flag";
  return (
    <span
      data-stamp={desktop ? kind : undefined}
      className={cn(
        // One line at every width (it wrapped and clipped on phones); a little room below for the tilt.
        "my-1 inline-block whitespace-nowrap rounded-[6px] border-2 px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] max-[899px]:tracking-[0.08em]",
        flag ? "-rotate-[6deg] border-[#c2552f] text-[#c2552f]" : "rotate-[6deg] border-[#4f8a3c] text-[#4f8a3c]",
        !desktop && "transition-[opacity,transform] duration-300 ease-out-expo",
        !desktop && !show && "scale-125 opacity-0",
        desktop && "opacity-0",
        !desktop && (flag ? "bg-[#c2552f]/10" : "bg-[#4f8a3c]/10"),
        className,
      )}
    >
      {flag ? (
        <>
          Flagged<span className="max-[399px]:hidden"> · dup. address</span>
        </>
      ) : kind === "approved" ? (
        "Approved"
      ) : (
        "Dispatched"
      )}
    </span>
  );
}
