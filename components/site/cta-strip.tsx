import { ScrollFx } from "@/components/fx/scroll-fx";
import { Button } from "@/components/system";
import { cn } from "@/lib/utils";

type CtaStripProps = {
  /** The question, in the visitor's terms. */
  title: string;
  /** One reassuring line. */
  note?: string;
  tone?: "paper" | "ink";
  className?: string;
};

/** A slim mid-page call to action, placed where a visitor may already have decided. */
export function CtaStrip({ title, note = "Reply within 24h · Milestones you approve", tone = "paper", className }: CtaStripProps) {
  const ink = tone === "ink";
  return (
    <ScrollFx effects={["tilt"]}>
    <div
      data-fx="tilt"
      className={cn(
        "flex flex-col gap-5 rounded-panel px-6 py-6 min-[760px]:flex-row min-[760px]:items-center min-[760px]:justify-between min-[760px]:px-8",
        ink ? "ink-raised tone-ink text-paper" : "raised",
        className,
      )}
    >
      <div>
        <p className="font-display text-[clamp(22px,2.4vw,30px)] font-extrabold leading-tight tracking-[-0.02em]">
          {title}
        </p>
        <p className={cn("mt-1.5 text-[15px]", ink ? "text-muted-ink" : "text-muted")}>{note}</p>
      </div>
      <Button href="/#contact" variant={ink ? "paper" : "ink"} arrow className="self-start min-[760px]:self-auto">
        Start a project
      </Button>
    </div>
    </ScrollFx>
  );
}
