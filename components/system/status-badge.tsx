import { cn } from "@/lib/utils";

export type ProjectStatus = "client" | "product" | "confidential";

const styles: Record<ProjectStatus, string> = {
  client: "bg-ink text-paper",
  product: "inset-track text-ink",
  confidential: "text-muted shadow-[inset_0_0_0_1px_var(--color-paper-edge)]",
};

const defaults: Record<ProjectStatus, string> = {
  client: "Client",
  product: "Product",
  confidential: "Confidential",
};

/** Project status badge (DESIGN.md §5). Pass children to override the text, e.g. "Product build". */
export function StatusBadge({
  status,
  children,
  className,
}: {
  status: ProjectStatus;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md px-[9px] py-[5px] font-mono text-[10px] uppercase leading-none tracking-[0.12em]",
        styles[status],
        className,
      )}
    >
      {children ?? defaults[status]}
    </span>
  );
}

/** Neutral outline tag for categories ("E-commerce + operations"). */
export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md px-[9px] py-[5px] font-mono text-[10px] uppercase leading-none tracking-[0.12em] text-tone-muted shadow-[inset_0_0_0_1px_var(--tone-hairline)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
