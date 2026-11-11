import type { Faq } from "@/lib/content/types";
import { ScrollFx } from "@/components/fx/scroll-fx";
import { Band, Drawer, SectionHeader } from "@/components/system";

/** 07 FAQ (cream). First drawer open. Also emits FAQPage structured data. */
export function FaqSection({ items, index = "07" }: { items: Faq[]; index?: string }) {
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
    <Band id="faq" aria-label="Questions" className="pb-12 min-[900px]:pb-16">
      <div className="wrap">
        <SectionHeader
          index={index}
          label="Questions"
          title={
            <>
              Before <em>you ask</em>
            </>
          }
          className="min-[900px]:mb-[34px]"
        />
        <ScrollFx effects={["rise"]} className="flex max-w-[940px] flex-col gap-3.5">
          {items.map((f, i) => (
            <div key={f.id} data-fx="item">
              <Drawer question={f.question} defaultOpen={i === 0}>
                <p>{f.answer}</p>
              </Drawer>
            </div>
          ))}
        </ScrollFx>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </Band>
  );
}
