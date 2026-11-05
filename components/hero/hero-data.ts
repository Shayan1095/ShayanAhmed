/**
 * Hero "The Build" (HERO_BUILD_BRIEF.md): copy, the Built-in index items and
 * the cover's colours and surfaces. Kept here so the copy is edited in one place.
 */

export const BUILT_IN = [
  { title: "Order checks", desc: "Risky orders are flagged before they ship." },
  { title: "Admin panel", desc: "Orders, stock and customers in one place." },
  { title: "Lead tracking", desc: "Every enquiry captured and followed up." },
  { title: "Email panel", desc: "Welcomes, follow-ups and replies from one inbox." },
  { title: "Daily brief", desc: "Your morning summary, ready before you are." },
  { title: "Smart agents", desc: "Routine work prepared — you approve every step." },
] as const;

export const BUILT_IN_INTERVAL_MS = 3600;

export const HERO_COPY = {
  issueMiddle: "Full-stack developer · Pakistan",
  issueRight: "Working worldwide",
  masthead: "The Build",
  creditLeft: "Shayan Ahmed — Full-stack developer",
  creditRight: "Storefronts · Back offices · Agents",
  eyebrow: "Cover story",
  primaryCta: "Start a project",
  secondaryCta: "See a case study",
} as const;

/** Cover palette (brief §5). */
export const COVER = {
  ink: "#120C08",
  paper: "#F3EADB",
  muted: "#DDD3C3",
  muted2: "#C4B8A4",
  muted3: "#8F8170",
  copper: "#E8B27A",
  onCopper: "#140D08",
} as const;

/** Copper foil text: static, no shimmer (brief §5). Inline so it can never be lost to stale CSS. */
export const FOIL: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(100deg, #8C5530 0%, #E8B27A 20%, #F7DCB5 30%, #C08048 46%, #7A4626 60%, #D9A06A 78%, #F2CC9C 88%, #9A5E33 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

/** Static copper glow: top right and bottom left. Never cursor-following. */
export const GLOW: React.CSSProperties = {
  background:
    "radial-gradient(ellipse 52% 40% at 72% 30%, rgba(214,140,76,.24) 0%, rgba(184,112,58,.09) 45%, transparent 72%), radial-gradient(ellipse 40% 30% at 10% 100%, rgba(184,112,58,.10) 0%, transparent 70%)",
};
