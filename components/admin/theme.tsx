"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { isLowPowerDevice } from "@/lib/device-power";
import { cn } from "@/lib/utils";

export type AdminTheme = "light" | "dark";
const KEY = "sa-admin-theme";

/**
 * Runs before the first paint so the admin never flashes the wrong theme:
 * the saved choice, else the system setting. Set on <html> so portalled
 * dialogs and sheets follow it.
 */
export const themeScript = `(()=>{try{var t=localStorage.getItem("${KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.adminTheme=t}catch(e){document.documentElement.dataset.adminTheme="light"}})()`;

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-admin-theme"] });
  return () => mo.disconnect();
}
const read = (): AdminTheme => (document.documentElement.dataset.adminTheme === "dark" ? "dark" : "light");

/** Saved choice, else the system setting (same rule as themeScript). */
function resolve(): AdminTheme {
  try {
    const t = localStorage.getItem(KEY);
    if (t === "light" || t === "dark") return t;
  } catch {
    /* fall through */
  }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useAdminTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as AdminTheme);
  const setTheme = (t: AdminTheme) => {
    document.documentElement.dataset.adminTheme = t;
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* private mode: still switches for this visit */
    }
  };
  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}

/**
 * Keeps <html> in admin mode while the admin is mounted (theme + power tier)
 * and hands the public site a clean <html> when you leave.
 */
export function AdminChrome() {
  const { theme } = useAdminTheme();
  useEffect(() => {
    const html = document.documentElement;
    if (!html.dataset.adminTheme) html.dataset.adminTheme = resolve();
    html.dataset.power = isLowPowerDevice() ? "low" : "full";
    return () => {
      delete html.dataset.adminTheme;
    };
  }, []);
  return <Toaster theme={theme} position="top-right" offset={{ top: 76 }} mobileOffset={{ top: 68 }} />;
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useAdminTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={cn(
        "grid size-9 cursor-pointer place-items-center rounded-lg text-ink/75 transition-colors hover:bg-paper-edge/35 hover:text-ink",
        className,
      )}
    >
      {dark ? <Sun className="size-[18px]" aria-hidden="true" /> : <Moon className="size-[18px]" aria-hidden="true" />}
    </button>
  );
}
