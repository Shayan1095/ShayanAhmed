import { SiteProviders } from "@/components/providers/site-providers";
import { Footer } from "@/components/site/footer";
import { MobileCta, RouteMobileCta } from "@/components/site/mobile-cta";
import { Navbar, RouteNavbar } from "@/components/site/navbar";
import { Suspense } from "react";
import { getSiteSettings } from "@/lib/content";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <SiteProviders>
      {/* Without JS, collapsed drawers open so every answer stays readable. */}
      <noscript>
        <style>{`[data-drawer-body]{height:auto!important;opacity:1!important}`}</style>
      </noscript>
      {/* The route streams in for pages rendered on demand; the fallback is the same bar for inner pages. */}
      <Suspense
        fallback={<Navbar availability={settings.availability} onHome={false} email={settings.email} linkedin={settings.linkedin} />}
      >
        <RouteNavbar availability={settings.availability} email={settings.email} linkedin={settings.linkedin} />
      </Suspense>
      {children}
      <Footer />
      <Suspense fallback={<MobileCta availability={settings.availability} onHome={false} />}>
        <RouteMobileCta availability={settings.availability} />
      </Suspense>
    </SiteProviders>
  );
}
