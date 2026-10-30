"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { DatabaseZap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { importStarterContent } from "./content-actions";

/** First run: copies the site's current content into the database so it can be edited here. */
export function ImportStarter() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-copper/50 bg-[#f6ead7] p-5">
      <div className="flex items-start gap-3">
        <DatabaseZap className="mt-0.5 size-5 shrink-0 text-[#8a521a]" aria-hidden="true" />
        <div>
          <h2 className="font-semibold">Import the site content to start editing</h2>
          <p className="max-w-[60ch] text-[13.5px] text-muted">
            Copies your current projects, testimonials, FAQ and settings into the database. The site looks the same
            afterwards; from then on, edits here go live. You only do this once.
          </p>
        </div>
      </div>
      <Button
        size="lg"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await importStarterContent();
            if (!res.ok) return void toast.error(res.error);
            toast.success("Content imported. You can edit it now.");
            router.refresh();
          })
        }
      >
        {pending && <Loader2 className="animate-spin" />}
        Import content
      </Button>
    </div>
  );
}
