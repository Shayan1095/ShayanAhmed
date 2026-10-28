import type { SiteSettings } from "@/lib/content/types";
import { Clock } from "@/components/site/clock";
import { Band, Label, Rise, SplitReveal } from "@/components/system";
import { ContactForm } from "./contact-form";
import { CopyButton } from "./copy-button";

/** 08 Contact (ink). The primary call to action. */
export function Contact({ settings }: { settings: SiteSettings }) {
  const rows = [
    settings.email && { id: "contact-email", label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    settings.linkedin && {
      id: "contact-linkedin",
      label: "LinkedIn",
      value: settings.linkedin.replace(/^https?:\/\/(www\.)?/, ""),
      href: settings.linkedin,
    },
  ].filter(Boolean) as { id: string; label: string; value: string; href: string }[];

  return (
    <Band tone="ink" id="contact" aria-label="Contact" className="section-pad">
      <div className="wrap grid grid-cols-1 items-start gap-14 min-[980px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <Label>08 · Contact</Label>
          <SplitReveal className="mb-6 mt-4 font-display text-[clamp(44px,6.4vw,92px)] font-extrabold uppercase leading-[0.88] tracking-[-0.04em] [font-variation-settings:'wdth'_120] [&_em]:font-bold [&_em]:italic [&_em]:text-copper [&_em]:[font-variation-settings:'wdth'_94]">
            Let&apos;s build <em>your system.</em>
          </SplitReveal>
          <Rise as="p" className="max-w-[28em] text-[17px] text-muted-ink">
            Tell me what you&apos;re building and what&apos;s slowing you down. I reply within one working day with next
            steps.
          </Rise>
          <Rise>
          <dl className="mt-[34px] flex flex-col gap-3">
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
            <div className="flex flex-wrap items-center gap-3">
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
        <Rise>
          <ContactForm projectTypes={settings.projectTypes} budgetRanges={settings.budgetRanges} />
        </Rise>
      </div>
    </Band>
  );
}
