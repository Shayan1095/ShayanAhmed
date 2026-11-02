import Image from "next/image";
import type { ImageRef } from "@/lib/content/types";

/**
 * The slab glass's upper area: the Brands Attire storefront. Uses the real
 * screenshot when one exists; until then a code-built illustration whose
 * products are marked "Example item". Sized in container units of the glass.
 */
export function Storefront({ image }: { image?: ImageRef }) {
  if (image) {
    return (
      <Image src={image.src} alt="" fill priority sizes="(min-width: 900px) 40vw, 92vw" className="object-cover object-top" />
    );
  }

  const products = [
    { name: "Linen shirt", tone: "#D9CBB3" },
    { name: "Classic kurta", tone: "#2c2925" },
    { name: "Cotton chinos", tone: "#B9A07E" },
    { name: "Overshirt", tone: "#6B4A2F" },
  ];

  return (
    <div className="keep-light absolute inset-0 flex flex-col gap-[1.6cqw] bg-paper-hi px-[4.1cqw] pt-[2.2cqw] text-ink">
      <div className="flex items-center justify-between border-b border-paper-lo pb-[1.6cqw]">
        <span className="font-display text-[2.3cqw] font-extrabold uppercase [font-variation-settings:'wdth'_112]">
          Brands Attire
        </span>
        <span className="flex gap-[3cqw] text-[1.35cqw] font-medium text-muted max-[520px]:hidden">
          <span>New in</span>
          <span>Men</span>
          <span>Women</span>
          <span>Sale</span>
        </span>
        <span className="rounded-[0.7cqw] bg-ink px-[1.8cqw] py-[0.8cqw] text-[1.3cqw] font-semibold text-paper">Cart · 2</span>
      </div>

      <div className="relative flex h-[46%] shrink-0 overflow-hidden rounded-[1.4cqw] bg-ink-2">
        <div className="flex flex-1 flex-col justify-center gap-[0.9cqw] pl-[3.5cqw]">
          <span className="font-mono text-[1.2cqw] uppercase tracking-[0.12em] text-copper">New season</span>
          <span className="font-display text-[3.2cqw] font-extrabold uppercase leading-[1.05] text-paper [font-variation-settings:'wdth'_112]">
            Linen, made
            <br />
            for heat.
          </span>
          <span className="w-fit rounded-[0.7cqw] bg-paper px-[1.6cqw] py-[0.7cqw] text-[1.3cqw] font-semibold">Shop the drop</span>
        </div>
        <div className="relative w-[46%] rounded-[1.4cqw] bg-[linear-gradient(135deg,#2c2925,#6b4a2f)]">
          <span className="absolute left-1/2 top-[13%] h-[80%] w-[26%] -translate-x-1/2 rounded-full bg-paper/90" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-[1.8cqw]">
        {products.map((p) => (
          <div key={p.name} className="flex flex-col gap-[0.4cqw]">
            <div className="grid aspect-[365/130] place-items-center rounded-[1cqw] bg-[#ede3d2]">
              <span className="h-[80%] w-[27%] rounded-[1.3cqw]" style={{ background: p.tone }} />
            </div>
            <span className="text-[1.35cqw] font-semibold">{p.name}</span>
            <span className="font-mono text-[1cqw] uppercase tracking-[0.08em] text-muted">Example item</span>
          </div>
        ))}
      </div>
    </div>
  );
}
