"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ExternalLink,
  FolderKanban,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Quote,
  Settings,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/admin/(panel)/actions";

const groups = [
  {
    label: "Work",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/inbox", label: "Inbox", icon: Inbox },
      { href: "/admin/planner", label: "Planner", icon: ListTodo },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/admin/projects", label: "Projects", icon: FolderKanban },
      { href: "/admin/testimonials", label: "Testimonials", icon: Quote },
      { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

const rowClass =
  "flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[14px] font-medium text-ink/75 transition-colors hover:bg-paper-edge/35 hover:text-ink";

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const active = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  return (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-6">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-1.5 px-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">{g.label}</p>
          <ul className="flex flex-col gap-0.5">
            {g.items.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active(href) ? "page" : undefined}
                  className={cn(rowClass, "aria-[current=page]:bg-ink aria-[current=page]:text-paper")}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="mt-auto flex flex-col gap-0.5 border-t border-paper-edge/70 pt-4">
        <a href="/" target="_blank" rel="noopener" className={rowClass}>
          <ExternalLink className="size-4" aria-hidden="true" />
          View site
        </a>
        <form action={signOutAction}>
          <button type="submit" className={cn(rowClass, "cursor-pointer")}>
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-ink font-display text-[12px] font-extrabold text-paper">
        SA
      </span>
      <span className="font-display text-[15px] font-extrabold">Admin</span>
    </Link>
  );
}

/** Sidebar on desktop, a top bar with a sheet menu on small screens. */
export function AdminNav() {
  return <AdminNavFrame pathname={usePathname()} />;
}

/** Same navigation without the active state, shown while the URL streams in. */
export function AdminNavFallback() {
  return <AdminNavFrame pathname="" />;
}

function AdminNavFrame({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col gap-7 border-r border-paper-edge/70 bg-paper-hi px-3 py-5 lg:flex">
        <div className="px-3">
          <Brand />
        </div>
        <NavLinks pathname={pathname} />
      </aside>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-paper-edge/70 bg-paper-hi px-4 lg:hidden">
        <Brand />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-paper-edge/35"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="flex w-[260px] flex-col gap-6 bg-paper-hi p-4">
            <SheetTitle className="px-3 pt-2">Menu</SheetTitle>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
