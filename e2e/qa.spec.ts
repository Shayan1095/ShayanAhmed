import AxeBuilder from "@axe-core/playwright";
import { test, type Browser, type Page } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

/**
 * QA pass (build brief, Phase 8). Measures and records; it does not fail the
 * suite. Run with QA=1. Results: e2e/.results/qa/qa.json, screenshots beside it.
 */
test.skip(!process.env.QA, "QA pass: run with QA=1");
test.describe.configure({ mode: "serial", timeout: 300_000 });

const OUT = "e2e/.results/qa";
const PAGES = ["/", "/work", "/work/brands-attire"];
const WIDTHS = [375, 768, 1440];
// Kept between runs, so one check can be re-run on its own.
const results: Record<string, unknown> = existsSync(`${OUT}/qa.json`) ? JSON.parse(readFileSync(`${OUT}/qa.json`, "utf8")) : {};
const save = () => {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/qa.json`, JSON.stringify(results, null, 2));
};

async function phone(browser: Browser, extra: Parameters<Browser["newContext"]>[0] = {}) {
  return browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, ...extra });
}

/** Slows the CPU 4× and the network to a fast 4G profile (Lighthouse-like). */
async function throttle(page: Page, network = true) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  if (network)
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
}

async function scrollThrough(page: Page, step = 500, wait = 120) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += step) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(wait);
  }
}

test("load: LCP, CLS, JS errors (mobile, 4x CPU, fast 4G)", async ({ browser }) => {
  const out: Record<string, unknown> = {};
  for (const path of PAGES) {
    const ctx = await phone(browser);
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
    await page.addInitScript(() => {
      const w = window as unknown as { __lcp: number; __cls: number };
      w.__lcp = 0;
      w.__cls = 0;
      new PerformanceObserver((l) => l.getEntries().forEach((e) => (w.__lcp = e.startTime))).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) =>
        l.getEntries().forEach((e) => {
          const s = e as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!s.hadRecentInput) w.__cls += s.value;
        }),
      ).observe({ type: "layout-shift", buffered: true });
    });
    await throttle(page);
    const t0 = Date.now();
    await page.goto(path, { waitUntil: "load" });
    const loadMs = Date.now() - t0;
    await page.waitForTimeout(2500);
    const lcp = await page.evaluate(() => (window as unknown as { __lcp: number }).__lcp);
    await scrollThrough(page, 700, 150);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    const lcpEl = await page.evaluate(
      () =>
        new Promise<string>((res) =>
          new PerformanceObserver((l) => {
            const e = l.getEntries().at(-1) as PerformanceEntry & { element?: Element };
            res(e?.element ? `${e.element.tagName.toLowerCase()}${e.element.id ? "#" + e.element.id : ""} ${(e.element.textContent ?? "").trim().slice(0, 40)}` : "?");
          }).observe({ type: "largest-contentful-paint", buffered: true }),
        ),
    );
    out[path] = { lcpMs: Math.round(lcp), lcpElement: lcpEl, cls: Number(cls.toFixed(4)), loadMs, errors };
    await ctx.close();
  }
  results.load = out;
  save();
});

test("accessibility: axe WCAG A/AA on every page, reduced motion, phone and desktop", async ({ browser }) => {
  const out: Record<string, string[]> = {};
  for (const w of [375, 1440]) {
    for (const path of PAGES) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" });
      const page = await ctx.newPage();
      await page.goto(path);
      await scrollThrough(page, 800, 60);
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      out[`${w} ${path}`] = violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target.join(" ")}`);
      await ctx.close();
    }
  }
  results.axe = out;
  save();
});

test("scroll at 4x CPU: long frames per section (desktop and phone)", async ({ browser }) => {
  const out: Record<string, unknown> = {};
  for (const [label, opts] of [
    ["desktop", { viewport: { width: 1440, height: 900 } }],
    ["phone", { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true }],
  ] as const) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    await page.goto("/");
    await page.waitForTimeout(1500);
    await throttle(page, false);
    await page.evaluate(() => {
      const w = window as unknown as { __frames: { dt: number; section: string }[] };
      w.__frames = [];
      let last = performance.now();
      const tick = (now: number) => {
        const dt = now - last;
        last = now;
        if (dt > 50) {
          const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest("section[id], section[aria-label], footer");
          w.__frames.push({ dt, section: el?.id || el?.getAttribute("aria-label") || el?.tagName.toLowerCase() || "?" });
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    // Wheel scrolling like a person (Lenis drives desktop), in small steps.
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let i = 0; i < h / 120 + 20; i++) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(800);
    const frames = await page.evaluate(() => (window as unknown as { __frames: { dt: number; section: string }[] }).__frames);
    const by: Record<string, { long: number; worstMs: number }> = {};
    for (const f of frames) {
      const s = (by[f.section] ??= { long: 0, worstMs: 0 });
      s.long++;
      s.worstMs = Math.max(s.worstMs, Math.round(f.dt));
    }
    out[label] = by;
    await ctx.close();
  }
  results.scroll = out;
  save();
});

test("reduced motion: every page shows its content, no errors", async ({ browser }) => {
  const out: Record<string, unknown> = {};
  for (const path of [...PAGES, "/does-not-exist"]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
    await page.goto(path);
    await scrollThrough(page, 800, 80);
    // Headings and paragraphs left invisible (opacity 0 or hidden by a transform) would mean a reveal never ran.
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll("main h1, main h2, main h3, main p")]
        .filter((el) => !el.closest("[aria-hidden='true'], .sr-only, [hidden]"))
        .filter((el) => {
          let n: Element | null = el;
          while (n && n !== document.body) {
            if (parseFloat(getComputedStyle(n).opacity) < 0.05) return true;
            n = n.parentElement;
          }
          return false;
        })
        .map((el) => (el.textContent ?? "").trim().slice(0, 50)),
    );
    out[path] = { hidden, errors };
    await ctx.close();
  }
  results.reducedMotion = out;
  save();
});

test("keyboard: Tab reaches nav, case toggle, agent feed, FAQ and form", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const seen = new Set<string>();
  let missingRing = 0;
  for (let i = 0; i < 400; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const ring = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
      const where = el.closest("section[id], header, footer, nav")?.id || el.closest("header, footer, nav")?.tagName.toLowerCase() || "?";
      return { where, label: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 30), tag: el.tagName, ring, shadow: cs.boxShadow !== "none", bg: cs.backgroundSize };
    });
    if (!info) continue;
    seen.add(`${info.where}: ${info.label}`);
    if (!info.ring && !info.shadow && !/2px|%/.test(info.bg)) missingRing++;
    if (info.where === "contact" && /send/i.test(info.label)) break;
  }
  const list = [...seen];
  const has = (re: RegExp) => list.some((s) => re.test(s));
  results.keyboard = {
    reached: {
      nav: has(/^(header|nav).*Work/),
      caseToggle: has(/^work: .*(Customer|Owner)/i),
      agentFeed: has(/^builder: Approve/),
      faq: has(/^faq: /),
      form: has(/^contact: .*Send/i),
    },
    stops: list.length,
    stopsWithoutVisibleFocus: missingRing,
  };
  save();
});

test("layout: no horizontal scroll, no duplicate ids, section screenshots at 375/768/1440", async ({ browser }) => {
  const out: Record<string, unknown> = {};
  for (const w of WIDTHS) {
    for (const path of PAGES) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce", isMobile: w < 768, hasTouch: w < 900 });
      const page = await ctx.newPage();
      await page.goto(path);
      await scrollThrough(page, 800, 60);
      const r = await page.evaluate(() => {
        const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
        const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
        const over = [...document.querySelectorAll("body *")]
          .filter((e) => {
            const b = e.getBoundingClientRect();
            return b.width > 0 && b.right > document.documentElement.clientWidth + 1 && getComputedStyle(e).position !== "fixed" && !e.closest("[class*='overflow-x'], [class*='overflow-hidden'], [aria-hidden='true']");
          })
          .slice(0, 3)
          .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 50)}`);
        return { hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth, dupes, over };
      });
      out[`${w} ${path}`] = r;
      results.layout = out;
      save();
      if (path === "/") {
        const sections = await page.locator("main > section, main > div > section, footer").all();
        for (const [i, s] of sections.entries()) {
          if (!(await s.isVisible())) continue; // e.g. the CTA strip, hidden on phones
          const id = (await s.getAttribute("id")) ?? (await s.getAttribute("aria-label"))?.slice(0, 20).replace(/\W+/g, "-") ?? `s${i}`;
          await s.scrollIntoViewIfNeeded();
          await page.waitForTimeout(150);
          await page.screenshot({ path: `${OUT}/${w}/${String(i).padStart(2, "0")}-${id}.png` });
        }
      } else await page.screenshot({ path: `${OUT}/${w}/page${path.replace(/\//g, "_")}.png`, fullPage: true });
      await ctx.close();
    }
  }
  results.layout = out;
  save();
});
