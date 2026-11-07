import { SiteProviders } from "@/components/providers/site-providers";
import { Footer } from "@/components/site/footer";
import { toNavProjects } from "@/components/site/nav-links";
import { Navbar, RouteNavbar } from "@/components/site/navbar";
import { Suspense } from "react";
import { ThemeColorSync } from "@/components/fx/theme-color-sync";
import { Preloader } from "@/components/preloader/preloader";
import { introGateScript } from "@/lib/intro-script";
import { issueDate } from "@/lib/issue-date";
import { getFeaturedProjects, getSiteSettings } from "@/lib/content";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, featured, date] = await Promise.all([getSiteSettings(), getFeaturedProjects(), issueDate()]);
  const nav = {
    email: settings.email,
    linkedin: settings.linkedin,
    projects: toNavProjects(featured),
  };
  return (
    <SiteProviders>
      {/* The intro: the gate runs before the overlay is parsed, so a skipped intro never flashes. Public pages only. */}
      <script dangerouslySetInnerHTML={{ __html: introGateScript }} />
      <Preloader date={date} />
      {/* Without JS, collapsed drawers open so every answer stays readable. */}
      <noscript>
        <style>{`[data-drawer-body]{height:auto!important;opacity:1!important}`}</style>
      </noscript>
      {/* The route streams in for pages rendered on demand; the fallback is the same bar for inner pages. */}
      <Suspense fallback={<Navbar {...nav} onHome={false} />}>
        <RouteNavbar {...nav} />
      </Suspense>
      {children}
      <Footer />
      <ThemeColorSync />
    </SiteProviders>
  );
}
