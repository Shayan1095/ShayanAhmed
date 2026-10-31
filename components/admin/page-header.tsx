import { cn } from "@/lib/utils";

/** Title row for each admin screen: what it is, why it matters, and its main action. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Small label above the title, e.g. today's date on the dashboard. */
  eyebrow?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-copper-ink">{eyebrow}</p>}
        <h1 className="font-display text-[30px] font-extrabold leading-[1.05] tracking-[-0.015em] sm:text-[34px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-[62ch] text-[14.5px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="mb-3 h-8 w-56 rounded-lg bg-paper-edge/45" />
      <div className="mb-8 h-4 w-80 max-w-full rounded bg-paper-edge/35" />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-paper-edge/25" />
        ))}
      </div>
      <div className="grid gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-paper-edge/20" />
        ))}
      </div>
    </div>
  );
}

/** Readable panel (near-solid) used across admin screens. Pass `glass` for chrome-like cards. */
export function Panel({ className, glass, ...props }: React.ComponentProps<"section"> & { glass?: boolean }) {
  return <section className={cn(glass ? "glass" : "surface", "rounded-2xl", className)} {...props} />;
}

/** Card heading with an optional link or control on the right. */
export function PanelTitle({ icon, children, aside }: { icon?: React.ReactNode; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[14px] font-semibold">
        {icon}
        {children}
      </h2>
      {aside}
    </div>
  );
}
