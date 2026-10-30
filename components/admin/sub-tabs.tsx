import Link from "next/link";
import { cn } from "@/lib/utils";

/** Section tabs under a page title, e.g. Projects → All · Add · Screenshots. */
export function SubTabs({ tabs, active }: { tabs: { href: string; label: string }[]; active: string }) {
  return (
    <nav aria-label="Section" className="mb-6 flex gap-1 overflow-x-auto border-b border-paper-edge/70">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={active === t.href ? "page" : undefined}
          className={cn(
            "-mb-px shrink-0 border-b-2 border-transparent px-3 pb-2.5 text-[14px] font-medium text-muted hover:text-ink",
            "aria-[current=page]:border-copper aria-[current=page]:text-ink",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export const projectTabs = [
  { href: "/admin/projects", label: "All projects" },
  { href: "/admin/projects/new", label: "Add project" },
  { href: "/admin/projects/screenshots", label: "Screenshots" },
];

export const testimonialTabs = [
  { href: "/admin/testimonials", label: "All testimonials" },
  { href: "/admin/testimonials/new", label: "Add testimonial" },
];
