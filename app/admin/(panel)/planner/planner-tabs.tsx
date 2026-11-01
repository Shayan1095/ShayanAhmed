import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin/planner/today", label: "Today", key: "today" },
  { href: "/admin/planner", label: "Tasks", key: "tasks" },
  { href: "/admin/planner/progress", label: "Progress", key: "progress" },
  { href: "/admin/planner/customize", label: "Customise", key: "customize" },
] as const;

/** Planner sections: the daily ritual, the tasks themselves, how it's going, and how it's set up. */
export function PlannerTabs({ active }: { active: (typeof tabs)[number]["key"] }) {
  return (
    <nav aria-label="Planner" className="mb-6 flex gap-1 border-b border-paper-edge/70">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 border-transparent px-3 pb-2.5 text-[14px] font-medium text-muted hover:text-ink",
            "aria-[current=page]:border-copper aria-[current=page]:text-ink",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
