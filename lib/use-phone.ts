"use client";

import { useSyncExternalStore } from "react";

const phoneQuery = "(max-width: 767px)";

/** True on phones (under 768px); false on the server, so desktop markup renders first. */
export function usePhone() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(phoneQuery);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(phoneQuery).matches,
    () => false,
  );
}
