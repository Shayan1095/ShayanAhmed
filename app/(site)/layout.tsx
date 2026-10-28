import { SiteProviders } from "@/components/providers/site-providers";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteProviders>
      {/* Without JS, collapsed drawers open and typed text shows in full. */}
      <noscript>
        <style>{`[data-drawer-body]{height:auto!important;opacity:1!important}`}</style>
      </noscript>
      {children}
    </SiteProviders>
  );
}
