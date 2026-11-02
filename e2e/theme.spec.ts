import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("site theme", () => {
  test("the switch turns the site dark, and the choice is remembered", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
    await page.setViewportSize({ width: 1366, height: 860 });
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "light");

    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(17, 15, 13)");

    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
  });

  test("first visit follows the system setting", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("dark theme passes contrast checks across the homepage", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
    await page.goto("/");
    await expectNoA11yViolations(page);
  });

  test("the admin keeps its own theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/admin/login");
    // The site's dark palette doesn't leak into the admin (it has its own switch).
    await expect(page.locator("html")).toHaveAttribute("data-admin-theme", /light|dark/);
  });
});
