import { cn } from "@/lib/utils";
import { StatusLight } from "./status-light";

type UiFragmentProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Small mono tag, e.g. "Order risk guard". */
  tag: string;
  /** The message, e.g. "Order #1042 flagged: duplicate address". */
  text: string;
  /** Show a lit status light in the tag. Mind the one-light-per-view rule. */
  live?: boolean;
  /** Decorative action keys, first one highlighted, e.g. ["Approve", "Skip"]. */
  actions?: string[];
};

/**
 * A small code-built UI card (risk flag, approval, email, lead) shown on a
 * screen or floating near a project. Built in HTML so it stays sharp and readable.
 */
export function UiFragment({ tag, text, live, actions, className, ...props }: UiFragmentProps) {
  return (
    <div
      className={cn(
        "tone-ink flex w-[236px] max-w-full flex-col gap-1.5 rounded-[14px] px-[15px] py-[13px] text-paper",
        "bg-[linear-gradient(180deg,#26231f,#171614)] shadow-[inset_0_1px_0_rgb(255_255_255/.1),0_24px_40px_-18px_rgb(17_17_17/.7)]",
        className,
      )}
      {...props}
    >
      <span className="flex items-center gap-[7px] font-mono text-[9.5px] uppercase leading-snug tracking-[0.14em] text-muted-ink">
        {live && <StatusLight size="sm" />}
        {tag}
      </span>
      <p className="text-[13.5px] font-semibold leading-[1.35]">{text}</p>
      {actions && actions.length > 0 && (
        <div className="mt-1 flex gap-1.5">
          {actions.map((a, i) => (
            <span
              key={a}
              className={cn(
                "rounded-md px-[9px] py-1 text-[11px] max-[899px]:text-[12px]",
                i === 0 ? "bg-copper font-semibold text-ink" : "bg-paper/8",
              )}
            >
              {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
