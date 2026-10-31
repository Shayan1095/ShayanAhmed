import { Suspense } from "react";
import { PageSkeleton } from "@/components/admin/page-header";
import { ShellProvider, ShellRefresh, Sidebar, SidebarLive, TopBar, TopBarLive } from "@/components/admin/shell";

/**
 * Admin shell: floating glass sidebar and top bar around a readable work area.
 * The chrome is static (the URL streams in behind Suspense); each page reads
 * the session and its data behind its own boundary.
 */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShellProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <div className="lg:flex lg:gap-5 lg:p-4">
        <Suspense fallback={<Sidebar pathname="" />}>
          <SidebarLive />
        </Suspense>
        <div className="min-w-0 flex-1">
          <Suspense fallback={<TopBar pathname="" />}>
            <TopBarLive />
            <ShellRefresh />
          </Suspense>
          <main id="main" className="px-4 pb-12 sm:px-6 lg:px-2">
            <div className="mx-auto max-w-[1240px]">
              <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
            </div>
          </main>
        </div>
      </div>
    </ShellProvider>
  );
}
