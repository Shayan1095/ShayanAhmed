import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers";

// Visitors are signed out; the footer needs no database (starter content fills it).
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("footer", () => {
  test("ends the page with the call to action and the name", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await footer.scrollIntoViewIfNeeded();

    await expect(footer.getByRole("img", { name: "Shayan Ahmed" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Start a project" })).toHaveAttribute("href", "/#contact");
    await expect(footer.getByRole("link", { name: /Back to top/ })).toHaveAttribute("href", "#main");

    // Contrast and labels on the dark band (WCAG AA).
    await expectNoA11yViolations(page, "footer");
  });

  test("fits a phone without sideways scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  });
});
