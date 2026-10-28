"use client";

import { useSyncExternalStore } from "react";
import { site } from "@/lib/site";

const fmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: site.timeZone,
});

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 10_000);
  return () => window.clearInterval(id);
}

/** "Pakistan · PKT 16:32 (GMT+5)", live. Client-only time; the server renders "--:--". */
export function Clock({ className }: { className?: string }) {
  const time = useSyncExternalStore(
    subscribe,
    () => fmt.format(new Date()),
    () => "--:--",
  );
  return (
    <span className={className}>
      Pakistan · PKT <time suppressHydrationWarning>{time}</time> (GMT+5)
    </span>
  );
}
