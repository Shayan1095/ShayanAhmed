/** Title row for each admin screen: what it is, why it matters, and its main action. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-[-0.01em]">{title}</h1>
        {description && <p className="mt-1 max-w-[62ch] text-[14.5px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="mb-3 h-7 w-48 rounded-md bg-paper-edge/50" />
      <div className="mb-8 h-4 w-80 max-w-full rounded bg-paper-edge/40" />
      <div className="grid gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-paper-edge/30" />
        ))}
      </div>
    </div>
  );
}

/** Flat panel used across admin screens. */
export function Panel({ className = "", ...props }: React.ComponentProps<"section">) {
  return <section className={`rounded-xl border border-paper-edge/70 bg-paper-hi ${className}`} {...props} />;
}
