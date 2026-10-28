import type { Faq } from "@/lib/content/types";
import { Band, Drawer, SectionHeader } from "@/components/system";

/** 07 FAQ (cream). First drawer open. Also emits FAQPage structured data. */
export function FaqSection({ items }: { items: Faq[] }) {
  if (items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <Band id="faq" aria-label="Questions" className="pb-20 min-[900px]:pb-[120px]">
      <div className="wrap">
        <SectionHeader
          index="07"
          label="Questions"
          title={
            <>
              Before <em>you ask</em>
            </>
          }
          className="min-[900px]:mb-[34px]"
        />
        <div className="flex max-w-[940px] flex-col gap-3.5">
          {items.map((f, i) => (
            <Drawer key={f.id} question={f.question} defaultOpen={i === 0}>
              <p>{f.answer}</p>
            </Drawer>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </Band>
  );
}
