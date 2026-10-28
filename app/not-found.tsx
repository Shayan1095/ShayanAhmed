import type { Metadata } from "next";
import { SiteProviders } from "@/components/providers/site-providers";
import { Footer } from "@/components/site/footer";
import { Navbar } from "@/components/site/navbar";
import { NoSignal } from "@/components/site/no-signal";
import { Button, Label } from "@/components/system";
import { getSiteSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/** Custom 404: same hardware language, a monitor with no signal, two ways back. */
export default async function NotFound() {
  const settings = await getSiteSettings();
  return (
    <SiteProviders>
      <Navbar availability={settings.availability} />
      <main id="main" className="pb-24 pt-[calc(env(safe-area-inset-top)+120px)]">
        <div className="wrap grid grid-cols-1 items-center gap-12 min-[980px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] min-[980px]:gap-16">
          <div>
            <Label>Error 404 · Page not found</Label>
            <h1 className="mb-6 mt-4 font-display text-[clamp(44px,6.4vw,92px)] font-extrabold uppercase leading-[0.88] tracking-[-0.04em] [font-variation-settings:'wdth'_118]">
              This page <em className="font-bold italic text-walnut [font-variation-settings:'wdth'_94]">lost its signal.</em>
            </h1>
            <p className="max-w-[30em] text-[17px] text-muted">
              The link may be old, or the address has a typo. Everything else is still running: the work, the
              services and the contact form.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/" arrow>
                Back to home
              </Button>
              <Button href="/#work" variant="paper">
                See the work
              </Button>
            </div>
          </div>
          <div className="@container">
            <NoSignal />
          </div>
        </div>
      </main>
      <Footer />
    </SiteProviders>
  );
}
