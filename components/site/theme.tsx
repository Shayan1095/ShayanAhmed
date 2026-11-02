"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { SITE_THEME_KEY } from "@/lib/theme-script";
import { cn } from "@/lib/utils";

/**
 * Site light/dark theme. The choice is saved per browser; the first visit
 * follows the system setting. Applied as html[data-theme] before the first
 * paint (siteThemeScript in app/layout.tsx), so there's no flash.
 */
export type SiteTheme = "light" | "dark";
const KEY = SITE_THEME_KEY;

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}
const read = (): SiteTheme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function useSiteTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as SiteTheme);
  const setTheme = (t: SiteTheme) => {
    const html = document.documentElement;
    // Colours ease across for a moment, then transitions go back to normal.
    html.classList.add("theme-switching");
    html.dataset.theme = t;
    window.setTimeout(() => html.classList.remove("theme-switching"), 480);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* private mode: still switches for this visit */
    }
  };
  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}

/** Sun/moon switch. The icon shows the theme you'd switch to. */
export function ThemeToggle({ className, withLabel = false }: { className?: string; withLabel?: boolean }) {
  const { theme, toggle } = useSiteTheme();
  const dark = theme === "dark";
  const label = dark ? "Switch to light theme" : "Switch to dark theme";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={withLabel ? undefined : label}
      title={label}
      className={cn("inline-flex cursor-pointer items-center justify-center gap-2 transition-colors", className)}
    >
      <span className="relative grid size-[18px] place-items-center" aria-hidden="true">
        <Sun className={cn("absolute size-[18px] transition-[transform,opacity] duration-500", dark ? "rotate-0 opacity-100" : "-rotate-90 opacity-0")} />
        <Moon className={cn("absolute size-[18px] transition-[transform,opacity] duration-500", dark ? "rotate-90 opacity-0" : "rotate-0 opacity-100")} />
      </span>
      {withLabel && <span>{dark ? "Light theme" : "Dark theme"}</span>}
    </button>
  );
}
