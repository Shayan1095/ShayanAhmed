import type { SiteSettings } from "@/lib/content/types";
import { whatsappHref } from "@/lib/content/socials";
import { Clock } from "@/components/site/clock";
import { Band, CoverGrid, Button, Label, Rise, SplitReveal, Typewriter } from "@/components/system";
import { ScrollFx } from "@/components/fx/scroll-fx";
import { ContactForm } from "./contact-form";
import { CopyButton } from "./copy-button";

const promises = [
  "A price per milestone, approved before work starts",
  "A live link to your build, updated weekly",
  "Calls in your time zone",
  "A reply within one working day",
];

/** 08 Contact (ink). The primary call to action. */
export function Contact({ settings, index = "08" }: { settings: SiteSettings; index?: string }) {
  const rows = [
    settings.email && { id: "contact-email", label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    settings.whatsapp && {
      id: "contact-whatsapp",
      label: "WhatsApp",
      value: settings.whatsapp,
      href: whatsappHref(settings.whatsapp)!,
    },
    settings.linkedin && {
      id: "contact-linkedin",
      label: "LinkedIn",
      value: settings.linkedin.replace(/^https?:\/\/(www\.)?/, ""),
      href: settings.linkedin,
    },
  ].filter(Boolean) as { id: string; label: string; value: string; href: string }[];

  return (
    <Band tone="ink" id="contact" aria-label="Contact" className="section-pad">
      <CoverGrid strength={0.5} />
      <div className="wrap relative grid grid-cols-1 items-start gap-14 min-[980px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <Label>
            <Typewriter text={`${index} · Contact`} speed={38} />
          </Label>
          <SplitReveal className="mb-6 mt-4 font-display text-[clamp(40px,5vw,72px)] font-extrabold leading-[0.95] tracking-[-0.03em] [&_em]:font-bold [&_em]:text-copper">
            Let&apos;s build <em>your system.</em>
          </SplitReveal>
          <Rise as="p" className="max-w-[28em] text-[17px] text-muted-ink">
            Tell me what you&apos;re building and what&apos;s slowing you down. I reply within one working day with next
            steps.
          </Rise>
          {(settings.bookingUrl || settings.startingPrice || settings.whatsapp) && (
            <Rise className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              {settings.whatsapp && (
                <Button href={whatsappHref(settings.whatsapp)!} variant="copper" arrow target="_blank" rel="noopener noreferrer">
                  WhatsApp me
                </Button>
              )}
              {settings.bookingUrl && (
                <Button href={settings.bookingUrl} variant="paper" arrow target="_blank" rel="noopener">
                  Book a call
                </Button>
              )}
              {settings.startingPrice && (
                <p className="text-[15px] text-muted-ink">
                  Projects usually start from <strong className="font-semibold text-paper">{settings.startingPrice}</strong>
                </p>
              )}
            </Rise>
          )}
          {/* What working together looks like, from the Process and FAQ. */}
          <ScrollFx as="ul" effects={["rise"]} className="mt-8 grid grid-cols-2 gap-3 max-[559px]:hidden">
            {promises.map((p) => (
              <li key={p} data-fx="item" className="flex items-start gap-3 text-[14.5px] leading-snug text-[#d9cfc0]">
                <span aria-hidden="true" className="mt-0.5 text-copper">
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ScrollFx>
          <Rise>
          <dl className="mt-6 flex flex-col gap-3 empty:hidden min-[560px]:mt-[34px]">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3">
                <dt className="min-w-[84px]">
                  <Label>{r.label}</Label>
                </dt>
                <dd className="flex items-center gap-3">
                  <a id={r.id} href={r.href} className="select-all font-mono text-[13.5px] text-paper hover:underline">
                    {r.value}
                  </a>
                  <CopyButton value={r.value} targetId={r.id} />
                </dd>
              </div>
            ))}
            {/* Phones show the clock in the menu and footer already. */}
            <div className="flex flex-wrap items-center gap-3 max-[559px]:hidden">
              <dt className="min-w-[84px]">
                <Label>Time</Label>
              </dt>
              <dd className="font-mono text-[13.5px] text-paper">
                <Clock />
              </dd>
            </div>
          </dl>
          </Rise>
        </div>
        {/* Signature: the control panel tilts up into place as you arrive. */}
        <ScrollFx effects={["tilt"]}>
          <div data-fx="tilt">
            <ContactForm projectTypes={settings.projectTypes} budgetRanges={settings.budgetRanges} />
          </div>
        </ScrollFx>
      </div>
    </Band>
  );
}
