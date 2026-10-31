"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  ChevronRight,
  ExternalLink,
  FolderKanban,
  FolderPlus,
  HelpCircle,
  Images,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Moon,
  Plus,
  Quote,
  Search,
  Settings,
  Sun,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { signOutAction } from "@/app/admin/(panel)/actions";
import { getShellData, type ShellData } from "@/app/admin/(panel)/shell-actions";
import { stageLabel } from "@/lib/admin/crm";
import type { Stage } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { ThemeToggle, useAdminTheme } from "./theme";

/* ------------------------------------------------------------------ */
/* Navigation map                                                      */
/* ------------------------------------------------------------------ */

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: (d: ShellData) => { n: number; tone: "copper" | "alert"; label: string } | null };

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "CRM",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      {
        href: "/admin/inbox",
        label: "Leads",
        icon: Users,
        badge: (d) =>
          d.followUps
            ? { n: d.followUps, tone: "alert", label: `${d.followUps} follow-ups due` }
            : d.waiting
              ? { n: d.waiting, tone: "copper", label: `${d.waiting} waiting for a reply` }
              : null,
      },
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

/** Breadcrumb names for every admin path segment. */
const crumbNames: Record<string, string> = {
  admin: "Dashboard",
  inbox: "Leads",
  planner: "Planner",
  progress: "Progress",
  customize: "Customise",
  projects: "Projects",
  new: "New",
  screenshots: "Screenshots",
  testimonials: "Testimonials",
  faq: "FAQ",
  settings: "Settings",
};

const isActive = (pathname: string, href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

/* ------------------------------------------------------------------ */
/* Shared state: shell data + palette                                  */
/* ------------------------------------------------------------------ */

type Shell = {
  data: ShellData | null;
  refresh: () => void;
  palette: boolean;
  setPalette: (open: boolean) => void;
  menu: boolean;
  setMenu: (open: boolean) => void;
};
const ShellContext = createContext<Shell | null>(null);
const useShell = () => use(ShellContext)!;

/** Holds the chrome's data and the Ctrl+K shortcut. Data loads after the page. */
export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ShellData | null>(null);
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState(false);

  const refresh = useCallback(() => {
    getShellData().then((res) => res.ok && res.data && setData(res.data));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((o) => !o);
      }
    };
    const onFocus = () => refresh();
    window.addEventListener("keydown", onKey);
    window.addEventListener("focus", onFocus);
    window.addEventListener("admin:changed", onFocus);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("admin:changed", onFocus);
    };
  }, [refresh]);

  const value = useMemo(() => ({ data, refresh, palette, setPalette, menu, setMenu }), [data, refresh, palette, menu]);
  return (
    <ShellContext value={value}>
      {children}
      <CommandPalette />
    </ShellContext>
  );
}

/** Tell the chrome that counts may have changed (after saving a lead, say). */
export function notifyShell() {
  window.dispatchEvent(new Event("admin:changed"));
}

/** Re-loads the badges on every navigation. Needs the URL, so it sits in Suspense. */
export function ShellRefresh() {
  const pathname = usePathname();
  const { refresh } = useShell();
  useEffect(() => refresh(), [pathname, refresh]);
  return null;
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 rounded-lg outline-offset-4">
      <span className="grid size-9 place-items-center rounded-xl bg-ink font-display text-[12.5px] font-extrabold text-paper shadow-[0_6px_16px_-6px_rgb(201_133_63/0.7)]">
        SA
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-display text-[15px] font-extrabold">Shayan Ahmed</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Studio CRM</span>
      </span>
    </Link>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { data } = useShell();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-1.5 px-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{g.label}</p>
          <ul className="flex flex-col gap-0.5">
            {g.items.map(({ href, label, icon: Icon, badge }) => {
              const active = isActive(pathname, href);
              const b = data && badge ? badge(data) : null;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-medium text-ink/72 transition-[background-color,color,box-shadow] duration-200 hover:bg-paper-hi/60 hover:text-ink",
                      "aria-[current=page]:bg-ink aria-[current=page]:text-paper aria-[current=page]:shadow-[0_8px_20px_-10px_rgb(17_17_17/0.55)]",
                    )}
                  >
                    {active && <span aria-hidden="true" className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r-full bg-copper" />}
                    <Icon className="size-[17px] shrink-0" aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    {b && (
                      <span
                        title={b.label}
                        className={cn(
                          "min-w-5 rounded-full px-1.5 py-px text-center font-mono text-[10.5px] font-semibold",
                          b.tone === "alert" ? "bg-alert text-paper" : "bg-copper text-on-copper",
                        )}
                      >
                        {b.n}
                        <span className="sr-only"> ({b.label})</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Account() {
  const { data } = useShell();
  const email = data?.email ?? "";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-paper-edge/50 bg-paper-hi/40 p-2.5">
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-copper to-walnut text-[11px] font-bold text-on-copper">
        {(email[0] ?? "S").toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-tight">Admin</span>
        <span className="block truncate text-[11.5px] text-muted">{email || "Signed in"}</span>
      </span>
      <form action={signOutAction}>
        <button
          type="submit"
          aria-label="Sign out"
          title="Sign out"
          className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-paper-edge/40 hover:text-ink"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

/** Floating glass sidebar on desktop. */
export function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="glass sticky top-4 hidden h-[calc(100dvh-2rem)] w-[248px] shrink-0 flex-col gap-7 rounded-[22px] p-4 lg:flex">
      <div className="px-1 pt-1">
        <Brand />
      </div>
      <div className="-mx-1 flex-1 overflow-y-auto px-1">
        <NavList pathname={pathname} />
      </div>
      <Account />
    </aside>
  );
}

export function SidebarLive() {
  return <Sidebar pathname={usePathname()} />;
}

/* ------------------------------------------------------------------ */
/* Top bar                                                             */
/* ------------------------------------------------------------------ */

function Crumbs({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);
  const trail = parts.map((p, i) => ({ href: "/" + parts.slice(0, i + 1).join("/"), name: crumbNames[p] ?? (/^[a-f0-9]{24}$/.test(p) ? "Edit" : p) }));
  const shown = trail.length > 1 ? trail.slice(1) : trail;
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-[13.5px]">
        <li className="hidden text-muted sm:block">Admin</li>
        {shown.map((c, i) => (
          <li key={c.href} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="hidden size-3.5 shrink-0 text-muted/70 sm:block" aria-hidden="true" />
            {i === shown.length - 1 ? (
              <span aria-current="page" className="truncate font-semibold">
                {c.name}
              </span>
            ) : (
              <Link href={c.href} className="truncate text-muted hover:text-ink">
                {c.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

const quickCreate = [
  { href: "/admin/inbox?new=1", label: "Lead", icon: UserPlus, hint: "From WhatsApp, LinkedIn, a referral" },
  { href: "/admin/planner?new=1", label: "Task", icon: ListTodo, hint: "Something to do" },
  { href: "/admin/projects/new", label: "Project", icon: FolderPlus, hint: "A new case study" },
  { href: "/admin/testimonials/new", label: "Testimonial", icon: Quote, hint: "A client's words" },
];

export function TopBar({ pathname }: { pathname: string }) {
  const { setPalette, menu, setMenu } = useShell();
  return (
    <header className="glass sticky top-0 z-30 mb-6 flex h-14 items-center gap-2 rounded-b-2xl px-3 sm:px-4 lg:top-4 lg:rounded-2xl">
      <button
        type="button"
        onClick={() => setMenu(true)}
        aria-label="Open menu"
        className="grid size-9 cursor-pointer place-items-center rounded-lg hover:bg-paper-edge/35 lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>
      <Crumbs pathname={pathname} />

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setPalette(true)}
          className="group flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-paper-edge/60 bg-paper-hi/50 px-2.5 text-[13px] text-muted transition-colors hover:border-paper-edge hover:text-ink sm:w-64"
        >
          <Search className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Search or jump to…</span>
          <span className="sr-only sm:hidden">Search</span>
          <kbd className="ml-auto hidden rounded-md border border-paper-edge/70 bg-paper-hi/70 px-1.5 py-px font-mono text-[10.5px] text-muted sm:inline">
            Ctrl K
          </kbd>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-ink px-3 text-[13px] font-semibold text-paper shadow-[0_8px_18px_-10px_rgb(17_17_17/0.6)] transition-transform hover:-translate-y-px">
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">New</span>
            <span className="sr-only sm:hidden">Create new</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-1.5">
            <DropdownMenuLabel className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">Create</DropdownMenuLabel>
            {quickCreate.map(({ href, label, icon: Icon, hint }) => (
              <DropdownMenuItem key={href} asChild className="cursor-pointer gap-3 rounded-lg px-2 py-2">
                <Link href={href}>
                  <Icon className="size-4" aria-hidden="true" />
                  <span className="flex flex-col">
                    <span className="text-[13.5px] font-semibold">{label}</span>
                    <span className="text-[11.5px] text-muted">{hint}</span>
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
        <a
          href="/"
          target="_blank"
          rel="noopener"
          aria-label="View site (opens in a new tab)"
          title="View site"
          className="hidden size-9 place-items-center rounded-lg text-ink/75 transition-colors hover:bg-paper-edge/35 hover:text-ink sm:grid"
        >
          <ExternalLink className="size-[18px]" aria-hidden="true" />
        </a>
      </div>

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="flex w-[280px] flex-col gap-6 p-4">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="px-1 pt-1">
            <Brand />
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavList pathname={pathname} onNavigate={() => setMenu(false)} />
          </div>
          <Account />
        </SheetContent>
      </Sheet>
    </header>
  );
}

export function TopBarLive() {
  return <TopBar pathname={usePathname()} />;
}

/* ------------------------------------------------------------------ */
/* Command palette (Ctrl+K)                                            */
/* ------------------------------------------------------------------ */

function CommandPalette() {
  const { data, palette, setPalette } = useShell();
  const router = useRouter();
  const { theme, toggle } = useAdminTheme();
  const [, start] = useTransition();

  const go = (href: string) => {
    setPalette(false);
    start(() => router.push(href));
  };

  return (
    <Dialog open={palette} onOpenChange={setPalette}>
      <DialogContent showCloseButton={false} className="top-[18%] translate-y-0 overflow-hidden rounded-2xl p-0 sm:max-w-[600px]">
        <DialogTitle className="sr-only">Search and commands</DialogTitle>
        <DialogDescription className="sr-only">Jump to a page, a lead or a project, or run a quick action.</DialogDescription>
        {/* Plain "contains" matching: predictable for names (fuzzy matched "sara" to "Dashboard"). */}
        <Command loop filter={(value, search) => (value.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0)}>
          <CommandInput placeholder="Search leads, projects, pages…" />
          <CommandList>
            <CommandEmpty>Nothing matches. Try a name or a page.</CommandEmpty>
            <CommandGroup heading="Create">
              {quickCreate.map(({ href, label, icon: Icon }) => (
                <CommandItem key={href} value={`new ${label}`} onSelect={() => go(href)}>
                  <Icon aria-hidden="true" /> New {label.toLowerCase()}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Go to">
              {groups.flatMap((g) => g.items).map(({ href, label, icon: Icon }) => (
                <CommandItem key={href} value={`page ${label}`} onSelect={() => go(href)}>
                  <Icon aria-hidden="true" /> {label}
                </CommandItem>
              ))}
              <CommandItem value="page screenshots" onSelect={() => go("/admin/projects/screenshots")}>
                <Images aria-hidden="true" /> Screenshots
              </CommandItem>
              <CommandItem value="page planner progress" onSelect={() => go("/admin/planner/progress")}>
                <ListTodo aria-hidden="true" /> Planner progress
              </CommandItem>
            </CommandGroup>
            {data && data.leads.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Leads">
                  {data.leads.map((l) => (
                    <CommandItem key={l.id} value={`lead ${l.name} ${l.company} ${l.id}`} onSelect={() => go(`/admin/inbox?lead=${l.id}`)}>
                      <Users aria-hidden="true" />
                      <span className="truncate">{l.name}</span>
                      {l.company && <span className="truncate text-[12.5px] opacity-60">{l.company}</span>}
                      <CommandShortcut>{stageLabel[l.stage as Stage] ?? l.stage}</CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            {data && data.projects.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Projects">
                  {data.projects.map((p) => (
                    <CommandItem key={p.id} value={`project ${p.title} ${p.id}`} onSelect={() => go(`/admin/projects/${p.id}`)}>
                      <FolderKanban aria-hidden="true" /> {p.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem
                value="toggle theme dark light mode"
                onSelect={() => {
                  toggle();
                  setPalette(false);
                }}
              >
                {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </CommandItem>
              <CommandItem
                value="view site"
                onSelect={() => {
                  setPalette(false);
                  window.open("/", "_blank", "noopener");
                }}
              >
                <ExternalLink aria-hidden="true" /> View site
              </CommandItem>
              <CommandItem value="sign out log out" onSelect={() => start(() => signOutAction())}>
                <LogOut aria-hidden="true" /> Sign out
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
