/**
 * Artwork drawn onto 2D canvases and used as textures on the 3D slab.
 * Coordinates follow the reference build (screen canvas 1690 × 1040 px).
 */
import type { HeroChannel } from "@/lib/content/types";
import type { HeroState } from "./shared";

export const SCW = 1690;
export const SCH = 1040;
export const STRIP_PX = 300; // matches DEV.STRIP / DEV.SH
export const STORE_PX = SCH - STRIP_PX;

const C = {
  paper: "#F3EADB",
  paperHi: "#FBF6EC",
  paperLo: "#E4D8C3",
  ink: "#111111",
  ink2: "#1E1C1A",
  ink3: "#2C2925",
  muted: "#675E52",
  mutedInk: "#A89D8B",
  walnut: "#6B4A2F",
  copper: "#C9853F",
};

/** next/font family names, read from the CSS variables on <html>. */
export function fonts() {
  const s = getComputedStyle(document.documentElement);
  const get = (v: string, fb: string) => s.getPropertyValue(v).trim() || fb;
  return {
    display: get("--font-anybody", "'Arial Narrow', sans-serif"),
    body: get("--font-hanken", "system-ui, sans-serif"),
    mono: get("--font-martian", "ui-monospace, monospace"),
  };
}

export function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function rr(x: CanvasRenderingContext2D, X: number, Y: number, W: number, H: number, R: number) {
  x.beginPath();
  x.roundRect(X, Y, W, H, R);
}

function truncate(x: CanvasRenderingContext2D, s: string, max: number) {
  if (x.measureText(s).width <= max) return s;
  while (s.length && x.measureText(`${s}…`).width > max) s = s.slice(0, -1);
  return `${s}…`;
}

/** Upper glass: the storefront illustration (or a real screenshot). */
export function drawStore(c: HTMLCanvasElement, screenshot?: HTMLImageElement) {
  const x = c.getContext("2d")!;
  const F = fonts();
  x.clearRect(0, 0, SCW, STORE_PX);
  if (screenshot) {
    // cover, aligned to the top
    const s = Math.max(SCW / screenshot.width, STORE_PX / screenshot.height);
    x.drawImage(screenshot, 0, 0, screenshot.width * s, screenshot.height * s);
    return;
  }
  x.fillStyle = C.paperHi;
  x.fillRect(0, 0, SCW, STORE_PX);
  x.textBaseline = "middle";
  x.textAlign = "left";
  x.fillStyle = C.ink;
  x.font = `800 40px ${F.display}`;
  x.fillText("BRANDS ATTIRE", 70, 66);
  x.font = `500 24px ${F.body}`;
  x.fillStyle = C.muted;
  ["New in", "Men", "Women", "Sale"].forEach((t, i) => x.fillText(t, 640 + i * 150, 66));
  x.fillStyle = C.ink;
  rr(x, 1450, 40, 170, 52, 12);
  x.fill();
  x.fillStyle = C.paper;
  x.font = `600 22px ${F.body}`;
  x.fillText("Cart · 2", 1488, 66);
  x.fillStyle = C.paperLo;
  x.fillRect(70, 112, 1550, 2);
  x.fillStyle = C.ink2;
  rr(x, 70, 136, 1550, 300, 24);
  x.fill();
  const g = x.createLinearGradient(900, 136, 1620, 436);
  g.addColorStop(0, C.ink3);
  g.addColorStop(1, C.walnut);
  x.fillStyle = g;
  rr(x, 900, 136, 720, 300, 24);
  x.fill();
  x.fillStyle = "rgba(243,234,219,.92)";
  rr(x, 1170, 176, 190, 240, 95);
  x.fill();
  x.fillStyle = C.copper;
  x.font = `500 20px ${F.mono}`;
  x.fillText("NEW SEASON", 130, 196);
  x.fillStyle = C.paper;
  x.font = `800 66px ${F.display}`;
  x.fillText("LINEN, MADE", 130, 268);
  x.fillText("FOR HEAT.", 130, 338);
  x.fillStyle = C.paper;
  rr(x, 130, 376, 220, 44, 12);
  x.fill();
  x.fillStyle = C.ink;
  x.font = `600 22px ${F.body}`;
  x.fillText("Shop the drop", 158, 398);
  const tones = ["#D9CBB3", C.ink3, "#B9A07E", C.walnut];
  const names = ["Linen shirt", "Classic kurta", "Cotton chinos", "Overshirt"];
  for (let i = 0; i < 4; i++) {
    const cx = 70 + i * 395;
    x.fillStyle = "#EDE3D2";
    rr(x, cx, 462, 365, 170, 18);
    x.fill();
    x.fillStyle = tones[i];
    rr(x, cx + 132, 478, 100, 138, 22);
    x.fill();
    x.fillStyle = C.ink;
    x.font = `600 24px ${F.body}`;
    x.fillText(names[i], cx, 660);
    x.fillStyle = C.muted;
    x.font = `400 18px ${F.mono}`;
    x.fillText("EXAMPLE ITEM", cx, 694);
  }
}

/** Channel tab hit areas on the strip canvas (px). */
export const TABS: { ch: HeroChannel; label: string; x: number }[] = [
  { ch: "site", label: "SITE", x: 1110 },
  { ch: "orders", label: "ORDERS", x: 1280 },
  { ch: "leads", label: "LEADS", x: 1450 },
];
const TAB_W = 160;
const TAB_Y = 30;
const TAB_H = 50;

export function tabAt(px: number, py: number): HeroChannel | null {
  if (py < TAB_Y || py > TAB_Y + TAB_H) return null;
  return TABS.find((t) => px >= t.x && px <= t.x + TAB_W)?.ch ?? null;
}

/**
 * The dark live strip. `typed` is how many characters of the latest line
 * are visible; `caretOn` blinks the cursor.
 */
export function drawStrip(c: HTMLCanvasElement, live: HeroState["live"], typed: number, caretOn: boolean) {
  const x = c.getContext("2d")!;
  const F = fonts();
  // The canvas may be smaller than the design size; draw in design units.
  const k = c.width / SCW;
  x.setTransform(k, 0, 0, k, 0, 0);
  const g = x.createLinearGradient(0, 0, 0, STRIP_PX);
  g.addColorStop(0, "#1d1b18");
  g.addColorStop(1, "#0c0b0a");
  x.fillStyle = g;
  x.fillRect(0, 0, SCW, STRIP_PX);
  x.fillStyle = C.copper;
  x.fillRect(0, 0, SCW, 4);
  x.textBaseline = "alphabetic";
  x.textAlign = "left";
  x.shadowBlur = 0;
  x.font = `400 24px ${F.mono}`;
  x.fillStyle = C.mutedInk;
  x.fillText(`LIVE · ${live.mode.toUpperCase()} · ${live.clock}`, 70, 64);

  for (const t of TABS) {
    const lit = live.channels[t.ch];
    x.fillStyle = lit ? C.copper : "rgba(243,234,219,.06)";
    rr(x, t.x, TAB_Y, TAB_W, TAB_H, 10);
    x.fill();
    if (!lit) {
      x.strokeStyle = "rgba(243,234,219,.2)";
      x.lineWidth = 2;
      x.stroke();
    }
    x.fillStyle = lit ? C.ink : C.mutedInk;
    x.font = `500 20px ${F.mono}`;
    x.textAlign = "center";
    x.fillText(t.label, t.x + TAB_W / 2, TAB_Y + 33);
    x.textAlign = "left";
  }

  const lines = live.lines.slice(-2);
  let y = 168;
  lines.forEach((l, i) => {
    const latest = i === lines.length - 1;
    const text = latest ? l.text.slice(0, typed) : l.text;
    x.font = `500 40px ${F.mono}`;
    x.fillStyle = latest ? C.copper : "rgba(201,133,63,.6)";
    const tag = l.tag.toUpperCase();
    x.fillText(tag, 70, y);
    const tw = x.measureText(`${tag}  `).width;
    x.font = `400 40px ${F.mono}`;
    x.fillStyle = latest ? C.paper : C.mutedInk;
    const m = truncate(x, text, SCW - 140 - tw);
    x.fillText(m, 70 + tw, y);
    if (latest && caretOn) x.fillRect(70 + tw + x.measureText(m).width + 10, y - 32, 20, 40);
    y += 82;
  });
  x.fillStyle = "rgba(255,255,255,.03)";
  for (let s = 0; s < STRIP_PX; s += 4) x.fillRect(0, s, SCW, 1);
}

/** Layer 2 (Board = System): the owner dashboard, example data. */
export function drawDash(c: HTMLCanvasElement) {
  const x = c.getContext("2d")!;
  const F = fonts();
  x.fillStyle = "#121110";
  x.fillRect(0, 0, 1600, 1000);
  x.fillStyle = "#1B1917";
  x.fillRect(0, 0, 260, 1000);
  x.textBaseline = "middle";
  x.textAlign = "left";
  x.fillStyle = C.paper;
  x.font = `800 30px ${F.display}`;
  x.fillText("OWNER", 40, 70);
  ["Overview", "Orders", "Approvals", "Products", "Customers", "Agents"].forEach((t, i) => {
    if (i === 2) {
      x.fillStyle = "rgba(201,133,63,.16)";
      rr(x, 24, 140 + i * 66 - 26, 212, 52, 10);
      x.fill();
    }
    x.fillStyle = i === 2 ? C.copper : C.mutedInk;
    x.font = `500 23px ${F.body}`;
    x.fillText(t, 44, 140 + i * 66);
  });
  x.fillStyle = C.mutedInk;
  x.font = `400 18px ${F.mono}`;
  x.fillText("EXAMPLE DATA", 300, 60);
  x.fillStyle = C.paper;
  x.font = `800 40px ${F.display}`;
  x.fillText("TODAY", 300, 108);
  [
    ["Orders", "48"],
    ["To approve", "3"],
    ["Flagged", "2"],
    ["Dispatched", "41"],
  ].forEach(([k, v], i) => {
    const X = 300 + i * 320;
    x.fillStyle = C.ink2;
    rr(x, X, 150, 295, 150, 18);
    x.fill();
    x.fillStyle = C.mutedInk;
    x.font = `400 19px ${F.mono}`;
    x.fillText(k.toUpperCase(), X + 26, 190);
    x.fillStyle = i === 2 ? C.copper : C.paper;
    x.font = `800 60px ${F.display}`;
    x.fillText(v, X + 26, 256);
  });
  x.fillStyle = C.ink2;
  rr(x, 300, 330, 820, 620, 18);
  x.fill();
  x.fillStyle = C.mutedInk;
  x.font = `400 19px ${F.mono}`;
  x.fillText("SALES · 14 DAYS", 330, 375);
  x.strokeStyle = "rgba(243,234,219,.08)";
  x.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    x.beginPath();
    x.moveTo(330, 440 + i * 110);
    x.lineTo(1090, 440 + i * 110);
    x.stroke();
  }
  const pts = [0.3, 0.42, 0.38, 0.55, 0.5, 0.62, 0.58, 0.7, 0.66, 0.75, 0.72, 0.84, 0.8, 0.9];
  x.beginPath();
  pts.forEach((v, i) => (i ? x.lineTo(340 + i * 57, 880 - v * 430) : x.moveTo(340, 880 - v * 430)));
  x.strokeStyle = C.copper;
  x.lineWidth = 5;
  x.stroke();
  x.lineTo(340 + 13 * 57, 880);
  x.lineTo(340, 880);
  x.closePath();
  const gr = x.createLinearGradient(0, 450, 0, 880);
  gr.addColorStop(0, "rgba(201,133,63,.28)");
  gr.addColorStop(1, "rgba(201,133,63,0)");
  x.fillStyle = gr;
  x.fill();
  x.fillStyle = C.ink2;
  rr(x, 1145, 330, 395, 620, 18);
  x.fill();
  x.fillStyle = C.mutedInk;
  x.font = `400 19px ${F.mono}`;
  x.fillText("NEEDS YOU", 1170, 375);
  [
    ["#1042", "Duplicate address", "Flagged"],
    ["Restock", "3 items low", "Approve"],
    ["Return", "Size exchange", "Approve"],
    ["#1051", "Ready to ship", "Done"],
  ].forEach(([a, b, s], i) => {
    const Y = 420 + i * 128;
    x.fillStyle = "#262320";
    rr(x, 1165, Y, 355, 108, 14);
    x.fill();
    x.fillStyle = C.paper;
    x.font = `600 24px ${F.body}`;
    x.fillText(a, 1190, Y + 36);
    x.fillStyle = C.mutedInk;
    x.font = `400 20px ${F.body}`;
    x.fillText(b, 1190, Y + 74);
    x.fillStyle = s === "Done" ? C.ink3 : s === "Flagged" ? "rgba(201,133,63,.22)" : C.copper;
    rr(x, 1395, Y + 34, 108, 40, 9);
    x.fill();
    x.fillStyle = s === "Approve" ? C.ink : s === "Flagged" ? C.copper : C.mutedInk;
    x.font = `600 18px ${F.body}`;
    x.textAlign = "center";
    x.fillText(s, 1449, Y + 55);
    x.textAlign = "left";
  });
}

/** Layer 3 (Core = Automation): agent ports wired to the chip. */
export const PORTS = ["BRIEF", "RISK", "STOCK", "RETURNS", "DRAFTS", "CATALOG", "MERCH", "FEEDBACK"] as const;

export function drawCore(c: HTMLCanvasElement) {
  const x = c.getContext("2d")!;
  const F = fonts();
  const U = 400;
  const cx = 720;
  const cy = 460;
  x.clearRect(0, 0, 1440, 920);
  x.font = `500 15px ${F.mono}`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  PORTS.forEach((n, k) => {
    const a = ((-90 + 22.5 + k * 45) * Math.PI) / 180;
    const px = cx + Math.cos(a) * 1.36 * U;
    const py = cy + Math.sin(a) * 0.84 * U;
    x.strokeStyle = "rgba(107,74,47,.45)";
    x.lineWidth = 3;
    x.beginPath();
    x.moveTo(cx + Math.cos(a) * 0.52 * U, cy + Math.sin(a) * 0.52 * U);
    x.lineTo(px, py);
    x.stroke();
    x.fillStyle = "rgba(251,246,236,.97)";
    rr(x, px - 80, py - 23, 160, 46, 11);
    x.fill();
    x.strokeStyle = "rgba(17,17,17,.35)";
    x.lineWidth = 2;
    x.stroke();
    x.fillStyle = "rgba(17,17,17,.8)";
    x.fillText(n, px, py + 1);
  });
  x.textAlign = "left";
  x.font = `400 18px ${F.mono}`;
  x.fillStyle = "rgba(17,17,17,.5)";
  x.fillText("CORE · 8 AGENTS · OWNER APPROVAL", 70, 70);
}

export function drawChip(c: HTMLCanvasElement) {
  const x = c.getContext("2d")!;
  const F = fonts();
  x.clearRect(0, 0, 256, 256);
  x.textAlign = "center";
  x.fillStyle = C.paper;
  x.font = `800 48px ${F.display}`;
  x.fillText("CORE", 128, 130);
  x.fillStyle = C.copper;
  x.font = `400 15px ${F.mono}`;
  x.fillText("AGENTS ×8", 128, 168);
}

/** Footer slab screen: powers down as `level` goes from 1 to 0. */
export function drawFootScreen(c: HTMLCanvasElement, level: number) {
  const x = c.getContext("2d")!;
  const F = fonts();
  x.fillStyle = "#0c0b0a";
  x.fillRect(0, 0, SCW, SCH);
  x.textAlign = "center";
  x.textBaseline = "alphabetic";
  x.font = `400 40px ${F.mono}`;
  x.fillStyle = `rgba(168,157,139,${0.9 * level})`;
  x.fillText("SESSION COMPLETE", SCW / 2, 450);
  x.font = `800 104px ${F.display}`;
  x.fillStyle = `rgba(243,234,219,${level})`;
  x.fillText("THANKS FOR SCROLLING", SCW / 2, 590);
  x.fillStyle = `rgba(201,133,63,${level})`;
  x.beginPath();
  x.arc(SCW / 2, 690, 12, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "rgba(255,255,255,.03)";
  for (let s = 0; s < SCH; s += 4) x.fillRect(0, s, SCW, 1);
}
