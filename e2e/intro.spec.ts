import { expect, test } from "@playwright/test";

// SA-Brand preloader brief: first visit only, skippable, never with reduced motion, never in the admin.
test.use({ storageState: { cookies: [], origins: [] } });

const intro = (page: import("@playwright/test").Page) => page.evaluate(() => document.documentElement.dataset.intro ?? null);

test.describe("intro", () => {
  test("plays once, splits, reveals the hero, and is skipped on reload", async ({ page }) => {
    await page.goto("/?intro");
    expect(await intro(page)).not.toBe("skip");
    await expect(page.locator(".sa-pl-overlay")).toBeAttached();
    // Hands the page back within the cap (fonts) + finish + split + reveal.
    await page.waitForFunction(() => !document.documentElement.dataset.intro, null, { timeout: 8_000 });
    await expect(page.locator(".sa-pl-overlay")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: "Websites with the systems built in." })).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe("hidden");
    await page.goto("/");
    expect(await intro(page)).toBe("skip");
  });

  test("a click skips straight to the split", async ({ page }) => {
    // Slow fonts hold the intro at 92% (up to its 3s cap), so there is time to click.
    await page.route(/\.woff2$/, async (route) => {
      await new Promise((r) => setTimeout(r, 6_000));
      await route.continue();
    });
    // Times (page clock) of the click and of the split that follows it.
    await page.addInitScript(() => {
      const w = window as unknown as { __click?: number; __split?: number };
      addEventListener(
        "pointerdown",
        () => {
          w.__click = performance.now();
          const html = document.documentElement;
          const seen = () => html.dataset.intro !== "play" && (w.__split ??= performance.now());
          if (!seen()) new MutationObserver(seen).observe(html, { attributes: true, attributeFilter: ["data-intro"] });
        },
        { capture: true, once: true },
      );
    });
    await page.goto("/?intro", { waitUntil: "commit" });
    await page.waitForFunction(() => document.documentElement.dataset.intro === "play");
    await page.waitForTimeout(1_200); // the line has reached 92% and the page has hydrated
    await page.mouse.click(640, 400);
    await page.waitForFunction(() => document.documentElement.dataset.intro !== "play", null, { timeout: 5_000 });
    const { click, split } = await page.evaluate(() => {
      const w = window as unknown as { __click: number; __split: number };
      return { click: w.__click, split: w.__split };
    });
    // It splits on the click, not on its own schedule.
    expect(split - click).toBeLessThan(300);
    expect(page.url()).toMatch(/\/\?intro$/);
  });

  test("reduced motion never plays it", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?intro");
    expect(await intro(page)).toBe("skip");
  });

  test("the admin never plays it", async ({ page }) => {
    await page.goto("/admin/login?intro");
    expect(await intro(page)).toBeNull();
    await expect(page.locator(".sa-pl-overlay")).toHaveCount(0);
  });
});
