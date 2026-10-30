/** Local-time date helpers for the planner (due dates are stored as YYYY-MM-DD at UTC midnight). */

export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}

export function dueKey(due: string | null): string | null {
  return due ? due.slice(0, 10) : null;
}

const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

export function dueLabel(due: string | null, today = dayKey()): { text: string; tone: "overdue" | "today" | "soon" | "later" } | null {
  const k = dueKey(due);
  if (!k) return null;
  if (k < today) return { text: `Overdue · ${fmt.format(new Date(`${k}T12:00:00`))}`, tone: "overdue" };
  if (k === today) return { text: "Today", tone: "today" };
  if (k === addDays(today, 1)) return { text: "Tomorrow", tone: "soon" };
  if (k <= addDays(today, 6)) return { text: fmt.format(new Date(`${k}T12:00:00`)), tone: "soon" };
  return { text: fmt.format(new Date(`${k}T12:00:00`)), tone: "later" };
}

/** Monday of the week containing the date, as a day key. */
export function weekStart(d: Date): string {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (local.getDay() + 6) % 7;
  local.setDate(local.getDate() - offset);
  return dayKey(local);
}
