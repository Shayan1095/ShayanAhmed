import type { Metadata } from "next";
import { SiteProviders } from "@/components/providers/site-providers";
import { Footer } from "@/components/site/footer";
import { Navbar } from "@/components/site/navbar";
import { NoSignal } from "@/components/site/no-signal";
import { Button, Label } from "@/components/system";
import { getFeaturedProjects, getSiteSettings } from "@/lib/content";
import { toNavProjects } from "@/components/site/nav-links";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/** Custom 404: same hardware language, a monitor with no signal, two ways back. */
export default async function NotFound() {
  const [settings, featured] = await Promise.all([getSiteSettings(), getFeaturedProjects()]);
  return (
    <SiteProviders>
      <Navbar
        onHome={false}
        place="Lost signal"
        email={settings.email}
        linkedin={settings.linkedin}
        projects={toNavProjects(featured)}
      />
      <main id="main" className="pb-24 pt-[calc(env(safe-area-inset-top)+120px)]">
        <div className="wrap grid grid-cols-1 items-center gap-12 min-[980px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] min-[980px]:gap-16">
          <div>
            <Label>Error 404 · Page not found</Label>
            <h1 className="mb-6 mt-4 font-display text-[clamp(44px,6.4vw,92px)] font-extrabold leading-[0.95] tracking-[-0.03em]">
              This page <em className="font-bold text-walnut">lost its signal.</em>
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
