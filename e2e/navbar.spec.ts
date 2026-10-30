import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers";

// Visitors are signed out; none of this needs the database.
test.use({ storageState: { cookies: [], origins: [] } });

const scrollToSection = (page: Page, id: string) =>
  page.evaluate((sid) => {
    const el = document.getElementById(sid)!;
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.3);
  }, id);

const readout = (page: Page) => page.locator("header a[href='/'] span.font-mono");

/** Wait for fonts and late ScrollTrigger refreshes to settle before scrolling. */
const settle = async (page: Page) => {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
};

test.describe("navbar (desktop)", () => {
  test.use({ viewport: { width: 1366, height: 860 } });

  test("lists the page's chapters with their numbers", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const name of ["Work", "Services", "Process", "About"]) await expect(nav.getByRole("link", { name })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Process" })).toHaveAttribute("href", "#process");
  });

  test("scroll spy lights the section in view and the readout names it", async ({ page }) => {
    await page.goto("/");
    await expect(readout(page)).toHaveText("Full-stack developer");
    await settle(page);
    await scrollToSection(page, "services");
    const services = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Services" });
    await expect(services).toHaveAttribute("aria-current", "location");
    await expect(readout(page)).toHaveText("02 · Services", { timeout: 5000 });
  });

  test("the bar hides on scroll down and returns on scroll up", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const header = page.locator("header").first();
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect(header).toHaveClass(/-translate-y-\[130%\]/);
    await page.evaluate(() => window.scrollTo(0, 1100));
    await expect(header).not.toHaveClass(/-translate-y-\[130%\]/);
  });

  test("on case studies, Work stays lit and opens the work page", async ({ page }) => {
    await page.goto("/work/brands-attire");
    const work = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Work" });
    await expect(work).toHaveAttribute("aria-current", "page");
    await expect(work).toHaveAttribute("href", "/work");
    await expect(readout(page)).toHaveText("Case study");
  });

  test("navbar looks right", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("header").first()).toHaveScreenshot("navbar-desktop.png", {
      mask: [page.locator("header time, header [data-clock]")],
    });
  });
});

test.describe("navbar (phone)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("menu opens, traps focus, closes with Escape and returns focus", async ({ page }) => {
    // Reduced motion so the accessibility check sees settled content, not mid-fade.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const open = page.getByRole("button", { name: "Open menu" });
    await open.click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("button", { name: "Close menu" })).toBeFocused();

    // Tab past the last item wraps back inside the menu.
    for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
    expect(await menu.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    await expectNoA11yViolations(page);
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(open).toBeFocused();
  });

  test("menu links reach their sections", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: /Process/ }).click();
    await expect(page).toHaveURL(/#process$/);
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  });
});

test.describe("motion components", () => {
  test("typed labels and rolling numbers keep their real text for everyone", async ({ page }) => {
    await page.goto("/");
    // Full text is in the page from the start (screen readers, search engines).
    await expect(page.locator("#services .sr-only", { hasText: "02 · Services" })).toHaveCount(1);
    await expect(page.locator("#work .sr-only", { hasText: /^01$/ })).toHaveCount(1);
  });

  test("with reduced motion, labels show in full straight away", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await scrollToSection(page, "process");
    const label = page.locator("#process header [aria-hidden='true']").filter({ hasText: "04 · Process" }).last();
    await expect(label).toHaveText("04 · Process");
  });
});
