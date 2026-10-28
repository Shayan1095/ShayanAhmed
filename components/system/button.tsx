import Link from "next/link";
import { cn } from "@/lib/utils";
import { Magnet } from "./magnet";

type Variant = "ink" | "paper";
type Size = "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  /** Magnetic pull on desktop (React Bits Magnet). */
  magnetic?: boolean;
  /** Adds a → that nudges right on hover. */
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsLink = CommonProps &
  Omit<React.ComponentProps<"a">, keyof CommonProps> & { href: string };
type ButtonAsButton = CommonProps &
  Omit<React.ComponentProps<"button">, keyof CommonProps> & { href?: undefined };

export type ButtonProps = ButtonAsLink | ButtonAsButton;

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2.5 whitespace-nowrap rounded-control font-sans font-semibold " +
  "transition-[transform,box-shadow] duration-100 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  ink:
    "bg-[linear-gradient(180deg,#2a2826,var(--color-ink))] text-paper " +
    "shadow-[inset_0_1px_0_rgb(255_255_255/.14),0_2px_0_#000,0_12px_24px_-10px_rgb(17_17_17/.6)] " +
    "active:shadow-[inset_0_1px_0_rgb(255_255_255/.1),0_0_0_#000]",
  paper:
    "bg-[linear-gradient(180deg,var(--color-paper-hi),var(--color-paper))] text-ink " +
    "shadow-[var(--shadow-raised-sm),0_2px_0_var(--color-paper-edge)] active:shadow-inset",
};

const sizes: Record<Size, string> = {
  md: "min-h-12 px-[22px] text-[15px]",
  lg: "min-h-14 px-7 text-base",
};

function isExternal(href: string) {
  return /^(https?:|mailto:|tel:)/.test(href);
}

/**
 * Primary site button. Ink presses down 2px; paper is a raised key.
 * Labels are verbs: "Start a project", "Read the case study".
 */
export function Button(props: ButtonProps) {
  const { variant = "ink", size = "md", magnetic = true, arrow, className, children, ...rest } = props;
  const classes = cn(base, variants[variant], sizes[size], className);
  const content = (
    <>
      {children}
      {arrow && (
        <span
          aria-hidden="true"
          className="transition-transform duration-300 ease-out-expo group-hover/btn:translate-x-[3px]"
        >
          →
        </span>
      )}
    </>
  );

  let el: React.ReactNode;
  if (typeof rest.href === "string") {
    const { href, ...anchorProps } = rest as Omit<ButtonAsLink, keyof CommonProps>;
    // Hash and external links stay plain anchors (Lenis handles #anchors).
    el =
      href.startsWith("#") || isExternal(href) ? (
        <a href={href} className={classes} {...anchorProps}>
          {content}
        </a>
      ) : (
        <Link href={href} className={classes} {...anchorProps}>
          {content}
        </Link>
      );
  } else {
    const { type = "button", ...buttonProps } = rest as Omit<ButtonAsButton, keyof CommonProps>;
    el = (
      <button type={type} className={classes} {...buttonProps}>
        {content}
      </button>
    );
  }

  return magnetic ? <Magnet>{el}</Magnet> : el;
}
