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
    await page.goto("/?intro");
    await page.waitForFunction(() => document.documentElement.dataset.intro === "play");
    await page.waitForLoadState("load");
    await page.mouse.click(640, 400);
    await page.waitForFunction(() => document.documentElement.dataset.intro !== "play", null, { timeout: 2_000 });
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
