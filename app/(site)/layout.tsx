import { SiteProviders } from "@/components/providers/site-providers";
import { Footer } from "@/components/site/footer";
import { MobileCta } from "@/components/site/mobile-cta";
import { Navbar } from "@/components/site/navbar";
import { getSiteSettings } from "@/lib/content";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <SiteProviders>
      {/* Without JS, collapsed drawers open so every answer stays readable. */}
      <noscript>
        <style>{`[data-drawer-body]{height:auto!important;opacity:1!important}`}</style>
      </noscript>
      <Navbar availability={settings.availability} />
      {children}
      <Footer />
      <MobileCta availability={settings.availability} />
    </SiteProviders>
  );
}
