import Link from "next/link";
import { Database } from "lucide-react";
import type { DbState } from "@/lib/admin/data";

/** Shown instead of a screen when the database isn't ready, with the one step that fixes it. */
export function DbNotice({ state }: { state: Exclude<DbState, "ready"> }) {
  const copy = {
    "missing-env": {
      title: "Connect a database",
      text: "Add MONGODB_URI to .env.local (or to Vercel's environment variables), then restart. ADMIN.md has the details.",
    },
    unreachable: {
      title: "The database can't be reached",
      text: "Check that MongoDB is running and that MONGODB_URI is correct. The public site keeps serving its starter content meanwhile.",
    },
    empty: {
      title: "Import the starter content first",
      text: "The database is empty. Import the current site content once from the Overview, then edit it here.",
    },
  }[state];
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-paper-edge bg-paper-hi/60 p-6">
      <Database className="size-5 text-copper-ink" aria-hidden="true" />
      <h2 className="font-display text-lg font-extrabold">{copy.title}</h2>
      <p className="max-w-[60ch] text-[14px] text-muted">{copy.text}</p>
      {state === "empty" && (
        <Link href="/admin" className="text-[14px] font-semibold underline underline-offset-4">
          Go to Overview
        </Link>
      )}
    </div>
  );
}
