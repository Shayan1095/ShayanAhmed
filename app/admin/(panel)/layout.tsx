import { Suspense } from "react";
import { AdminNav, AdminNavFallback } from "@/components/admin/admin-nav";
import { PageSkeleton } from "@/components/admin/page-header";

/**
 * Admin shell. The navigation is static; each page reads the session and
 * its data behind this Suspense boundary (and checks the session itself).
 */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex">
      <Suspense fallback={<AdminNavFallback />}>
        <AdminNav />
      </Suspense>
      <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-9">
        <div className="mx-auto max-w-[1180px]">
          <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
        </div>
      </main>
    </div>
  );
}
