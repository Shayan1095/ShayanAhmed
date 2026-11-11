import { expect, test } from "@playwright/test";

/**
 * Paper section (build brief, Phase 6): Process is printed on cream with ink
 * text, its corners curtain with the scroll, and every chapter label carries
 * the magazine folio.
 */
test("process is cream with ink text, and the curtain rounds its top corners", async ({ page }) => {
  await page.goto("/");
  const process = page.locator("#process");
  await expect(process).toHaveCSS("background-color", "rgb(243, 234, 219)");
  await expect(process.locator("h3").first()).toHaveCSS("color", "rgb(17, 17, 17)");
  // Halfway up the screen the sheet's top corners are still rounded.
  await process.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2));
  const corner = process.locator('[data-curtain="tl"]');
  await expect.poll(() => corner.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)).toBeGreaterThan(0.05);
});

test("reduced motion: a plain colour change, no curtain", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/");
  const process = page.locator("#process");
  await process.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2));
  await page.waitForTimeout(400);
  expect(await process.locator('[data-curtain="tl"]').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)).toBe(0);
  await ctx.close();
});

test("chapter labels carry the folio", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#process header").getByText(/^No\. 01 · p\. \d{2}$/)).toBeAttached();
});
