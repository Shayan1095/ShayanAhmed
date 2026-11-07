import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("site theme (dark only)", () => {
  test("the site is dark even with a light system setting or an old saved choice", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("sa-theme", "light"));
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(26, 21, 17)"); // the espresso surface (#1a1511)
    // No theme switch any more.
    await expect(page.getByRole("button", { name: /Switch to (light|dark) theme/ })).toHaveCount(0);
  });

  test("passes contrast checks across the homepage", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expectNoA11yViolations(page);
  });

  test("the admin keeps its own theme", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator("html")).toHaveAttribute("data-admin-theme", /light|dark/);
  });
});
