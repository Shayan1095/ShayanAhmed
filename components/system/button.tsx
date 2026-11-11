import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "ink" | "paper" | "copper";
type Size = "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  /** Adds a → that nudges right on hover. */
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsLink = CommonProps &
  Omit<React.ComponentProps<"a">, keyof CommonProps> & {
    href: string;
    /** Page transition type for internal links, e.g. ["nav-forward"] (ignored for #hash and external links). */
    transitionTypes?: string[];
  };
type ButtonAsButton = CommonProps &
  Omit<React.ComponentProps<"button">, keyof CommonProps> & { href?: undefined };

export type ButtonProps = ButtonAsLink | ButtonAsButton;

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2.5 whitespace-nowrap rounded-control font-sans font-semibold " +
  "transition-[transform,box-shadow] duration-100 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  ink:
    "bg-[linear-gradient(180deg,var(--ink-key-top,#2a2826),var(--ink-key-bottom,var(--color-ink)))] text-paper " +
    "shadow-[inset_0_1px_0_rgb(255_255_255/.14),0_2px_0_#000,0_12px_24px_-10px_rgb(17_17_17/.6)] " +
    "active:shadow-[inset_0_1px_0_rgb(255_255_255/.1),0_0_0_#000]",
  paper:
    "bg-[linear-gradient(180deg,var(--color-paper-hi),var(--color-paper))] text-ink " +
    "shadow-[var(--shadow-raised-sm),0_2px_0_var(--color-paper-edge)] active:shadow-inset",
  /** Lit copper key, for dark (ink) bands: the one call to action there. */
  copper:
    "bg-[linear-gradient(180deg,#f0b46c,#c9853f_48%,#a56626)] text-ink " +
    "shadow-[inset_0_1px_0_rgb(255_255_255/.5),0_2px_0_#6b4a2f,0_14px_32px_-10px_rgb(224_154_79/.65)] " +
    "hover:shadow-[inset_0_1px_0_rgb(255_255_255/.55),0_2px_0_#6b4a2f,0_16px_40px_-8px_rgb(224_154_79/.85)] " +
    "active:shadow-[inset_0_1px_0_rgb(255_255_255/.4),0_0_0_#6b4a2f]",
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
  const { variant = "ink", size = "md", arrow, className, children, ...rest } = props;
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
    const { href, transitionTypes, ...anchorProps } = rest as Omit<ButtonAsLink, keyof CommonProps>;
    // Hash and external links stay plain anchors (Lenis handles #anchors).
    el =
      href.startsWith("#") || isExternal(href) ? (
        <a href={href} className={classes} {...anchorProps}>
          {content}
        </a>
      ) : (
        <Link href={href} transitionTypes={transitionTypes} className={classes} {...anchorProps}>
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

  return el;
}
