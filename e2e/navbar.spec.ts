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

  test("lists the page's chapters, without numbers", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const name of ["Work", "Services", "Process", "About"]) await expect(nav.getByRole("link", { name })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Process" })).toHaveAttribute("href", "#process");
    await expect(nav).not.toContainText(/\d/);
  });

  test("scroll spy lights the section in view and the readout names it", async ({ page }) => {
    await page.goto("/");
    await expect(readout(page)).toHaveText("Full-stack developer");
    await settle(page);
    await scrollToSection(page, "services");
    const services = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Services" });
    await expect(services).toHaveAttribute("aria-current", "location");
    // The section you're in glows; the others don't.
    await expect(services).toHaveClass(/nav-glow/);
    const process = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Process" });
    await expect(process).not.toHaveClass(/nav-glow/);
    await expect(readout(page)).toHaveText("Services", { timeout: 5000 });
  });

  test("the bar stays visible while scrolling down", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const header = page.locator("header").first();
    await page.evaluate(() => window.scrollTo(0, 2500));
    await page.waitForTimeout(600);
    await expect(header).toBeInViewport();
    await expect(header.getByRole("link", { name: "Start a project" })).toBeInViewport();
  });

  test("on case studies, Work stays lit and opens the work page", async ({ page }) => {
    await page.goto("/work/brands-attire");
    const work = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Work" });
    await expect(work).toHaveAttribute("aria-current", "page");
    await expect(work).toHaveAttribute("href", "/work");
    await expect(readout(page)).toHaveText("Case study");
  });

  test("the bar turns to glass once you scroll, and back at the top", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const bar = page.locator("header").first().locator("> div > div").first();
    const solid = /(^|\s)raised(\s|$)/;
    await expect(bar).toHaveClass(solid);
    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(bar).toHaveClass(/nav-glass/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(bar).toHaveClass(solid);
  });

  test("Work opens a preview of the featured case studies (mouse and keyboard)", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    const work = nav.getByRole("link", { name: "Work", exact: true });
    const panel = page.getByRole("region", { name: "Featured work" });

    await settle(page);
    const box = (await work.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(panel).toBeVisible();
    await expect(work).toHaveAttribute("aria-expanded", "true");
    await expect(panel.getByRole("link", { name: /Brands Attire/ })).toHaveAttribute("href", "/work/brands-attire");
    await expect(panel.getByRole("link", { name: "All work" })).toBeVisible();

    // Pointer leaves: it closes after a short pause.
    await page.mouse.move(10, 600);
    await expect(panel).toBeHidden();

    // Accessibility of the open panel (scoped: content beneath it is covered).
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(panel).toBeVisible();
    await expectNoA11yViolations(page, "#work-preview");
    await page.mouse.move(10, 600);
    await expect(panel).toBeHidden();

    // Keyboard: focusing Work opens it, Tab goes into the panel, Escape closes and returns to Work.
    await work.focus();
    await expect(panel).toBeVisible();
    await page.keyboard.press("Tab");
    expect(await panel.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(work).toBeFocused();
  });

  test("Start a project has no hover caption", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator("header").first().getByRole("link", { name: "Start a project" });
    await cta.hover();
    await expect(cta).toHaveText(/^Start a project/);
    await expect(page.locator("header").first()).not.toContainText("Reply within");
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

  test("menu shows the latest project", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    const card = menu.getByRole("link", { name: /Latest project/ });
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("href", "/work/brands-attire");
    // Letter-by-letter links still read as whole words.
    await expect(menu.getByRole("link", { name: "Services", exact: true })).toBeVisible();
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
    const label = page.locator("#process header [aria-hidden='true']").filter({ hasText: "03 · Process" }).last();
    await expect(label).toHaveText("03 · Process");
  });
});
