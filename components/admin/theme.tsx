"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sparkles, Sun } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { isLowPowerDevice } from "@/lib/device-power";
import { cn } from "@/lib/utils";

export type AdminTheme = "light" | "dark";
/** Glass effects: auto (detect the device), full (blur, refraction, drifting light) or lite (solid, cheap). */
export type AdminFx = "auto" | "full" | "lite";

const KEY = "sa-admin-theme";
const FX_KEY = "sa-admin-fx";

/**
 * Runs before the first paint so the admin never flashes the wrong theme:
 * the saved choice, else the system setting. Set on <html> so portalled
 * dialogs and sheets follow it.
 */
export const themeScript = `(()=>{try{var t=localStorage.getItem("${KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.adminTheme=t}catch(e){document.documentElement.dataset.adminTheme="light"}})()`;

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-admin-theme", "data-admin-fx"] });
  return () => mo.disconnect();
}
const read = (): AdminTheme => (document.documentElement.dataset.adminTheme === "dark" ? "dark" : "light");
const readFx = (): AdminFx => {
  const v = document.documentElement.dataset.adminFx;
  return v === "full" || v === "lite" ? v : "auto";
};

function stored<T extends string>(key: string, allowed: readonly T[]): T | null {
  try {
    const v = localStorage.getItem(key);
    return allowed.includes(v as T) ? (v as T) : null;
  } catch {
    return null;
  }
}
function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: still applies for this visit */
  }
}

/** Saved choice, else the system setting (same rule as themeScript). */
function resolve(): AdminTheme {
  return stored(KEY, ["light", "dark"] as const) ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

/** Chromium can refract through an SVG filter in backdrop-filter; other engines get blur only. */
function canRefract() {
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands ?? [];
  return brands.some((b) => /Chromium/i.test(b.brand));
}

/** Applies the effects tier to <html>: data-power (full/low) and data-liquid (refraction on/off). */
function applyFx(fx: AdminFx) {
  const html = document.documentElement;
  html.dataset.adminFx = fx;
  const full = fx === "full" || (fx === "auto" && !isLowPowerDevice());
  html.dataset.power = full ? "full" : "low";
  html.dataset.liquid = full && canRefract() ? "on" : "off";
}

export function useAdminTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as AdminTheme);
  const setTheme = (t: AdminTheme) => {
    document.documentElement.dataset.adminTheme = t;
    store(KEY, t);
  };
  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}

export const fxLabel: Record<AdminFx, string> = { auto: "Auto", full: "Full", lite: "Lite" };
const nextFx: Record<AdminFx, AdminFx> = { auto: "full", full: "lite", lite: "auto" };

export function useAdminFx() {
  const fx = useSyncExternalStore(subscribe, readFx, () => "auto" as AdminFx);
  const setFx = (v: AdminFx) => {
    store(FX_KEY, v);
    applyFx(v);
  };
  return { fx, setFx, cycle: () => setFx(nextFx[fx]) };
}

/**
 * Keeps <html> in admin mode while the admin is mounted (theme, effects tier,
 * refraction) and hands the public site a clean <html> when you leave. Also
 * renders the SVG displacement map the liquid glass refracts through.
 */
export function AdminChrome() {
  const { theme } = useAdminTheme();
  useEffect(() => {
    const html = document.documentElement;
    if (!html.dataset.adminTheme) html.dataset.adminTheme = resolve();
    applyFx(stored(FX_KEY, ["auto", "full", "lite"] as const) ?? "auto");
    return () => {
      delete html.dataset.adminTheme;
      delete html.dataset.adminFx;
      delete html.dataset.liquid;
    };
  }, []);
  return (
    <>
      <svg aria-hidden="true" width="0" height="0" className="pointer-events-none absolute">
        <filter id="liquid-refract" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="2" seed="11" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="3" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="34" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <Toaster theme={theme} position="top-right" offset={{ top: 76 }} mobileOffset={{ top: 68 }} />
    </>
  );
}

const iconButton =
  "grid size-9 cursor-pointer place-items-center rounded-lg text-ink/75 transition-colors hover:bg-paper-edge/35 hover:text-ink";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useAdminTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={cn(iconButton, className)}
    >
      {dark ? <Sun className="size-[18px]" aria-hidden="true" /> : <Moon className="size-[18px]" aria-hidden="true" />}
    </button>
  );
}

/** Cycles glass effects Auto → Full → Lite. Full forces liquid glass on devices that would get Lite. */
export function FxToggle({ className }: { className?: string }) {
  const { fx, cycle } = useAdminFx();
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Glass effects: ${fxLabel[fx]}. Change`}
      title={`Glass effects: ${fxLabel[fx]} (click to change)`}
      className={cn(iconButton, "relative", className)}
    >
      <Sparkles className={cn("size-[18px]", fx === "lite" && "opacity-45")} aria-hidden="true" />
      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 font-mono text-[8.5px] font-bold uppercase leading-none">
        {fx === "auto" ? "A" : fx === "full" ? "F" : "L"}
      </span>
    </button>
  );
}
