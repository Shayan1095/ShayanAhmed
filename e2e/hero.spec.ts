import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers";

// HERO_BUILD_BRIEF.md acceptance checklist.
test.use({ storageState: { cookies: [], origins: [] } });

const hero = (page: Page) => page.locator("section[aria-labelledby='hero-title']");
const lines = (page: Page, sel: string) =>
  page.evaluate((s) => {
    const el = document.querySelector(s)!;
    return Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
  }, sel);

test.describe("hero", () => {
  test("cover at 1440: one-line masthead, two-line headline, calls to action", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1040 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("heading", { level: 1, name: "Websites with the systems built in." })).toBeVisible();
    expect(await lines(page, "section[aria-labelledby='hero-title'] p[aria-hidden='true']")).toBe(1);
    expect(await lines(page, "#hero-title")).toBe(2);
    await expect(hero(page).getByRole("link", { name: /Start a project/ })).toHaveAttribute("href", "#contact");
    await expect(hero(page).getByRole("link", { name: "See a case study" })).toBeVisible();
    await expectNoA11yViolations(page, "section[aria-labelledby='hero-title']");
  });

  for (const [w, h] of [[390, 844], [768, 1024], [1024, 900], [1440, 1040]] as const) {
    test(`no sideways scroll and a one-line masthead at ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
      expect(await lines(page, "section[aria-labelledby='hero-title'] p[aria-hidden='true']")).toBe(1);
    });
  }

  test("Built-in index: cycles, clicks jump there, and the panel never changes height", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1040 });
    await page.goto("/");
    const panel = page.getByRole("complementary", { name: "What's built in" });
    await expect(panel).toContainText("Order checks");
    // Auto-advance (3.6s), with the pointer away from the panel.
    await page.mouse.move(5, 5);
    await expect(panel).toContainText("Admin panel", { timeout: 6000 });

    const steps = panel.getByRole("group", { name: "Choose a system" }).getByRole("button");
    await expect(steps).toHaveCount(6);
    const heights = new Set<number>();
    for (let i = 0; i < 6; i++) {
      await steps.nth(i).click();
      await expect(steps.nth(i)).toHaveAttribute("aria-pressed", "true");
      heights.add(Math.round((await panel.boundingBox())!.height));
    }
    expect(heights.size).toBe(1);
    await steps.nth(4).click();
    await expect(panel).toContainText("Daily brief");
  });

  test("reduced motion: no auto-advance, clicks still work", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const panel = page.getByRole("complementary", { name: "What's built in" });
    await page.mouse.move(5, 5);
    await page.waitForTimeout(4500);
    await expect(panel).toContainText("Order checks");
    await panel.getByRole("button", { name: "Smart agents" }).click();
    await expect(panel).toContainText("Routine work prepared");
  });
});
