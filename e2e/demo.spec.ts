import { expect, test, type Page } from "@playwright/test";

/**
 * The order flow's "Approve dispatch" plays the dispatch step straight away.
 */

const feed = (page: Page) => page.locator("#builder");
// One card at a time: wait out the outgoing card before acting.
const only = async (page: Page, name: RegExp) => {
  const b = feed(page).getByRole("button", { name });
  await expect(b).toHaveCount(1);
  return b;
};
const leftCount = async (page: Page) => Number((await feed(page).getByText(/^\d+ left$/).textContent())?.split(" ")[0]);

test("order flow: Approve dispatch plays the dispatch step at once (desktop)", async ({ page }) => {
  await page.goto("/");
  await page.locator("#services").scrollIntoViewIfNeeded();
  const button = page.locator("#services [data-ticket]").getByRole("button", { name: "Approve dispatch" });
  // Scroll the pinned stage forward until the receipt asks for approval.
  for (let i = 0; i < 40 && !(await button.isVisible()); i++) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(120);
  }
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.locator("#services [data-ticket]").getByText("› Approved by owner")).toBeVisible({ timeout: 1500 });
});

test("order flow: Approve dispatch on the phone rail", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto("/");
  const button = page.locator("#services").getByRole("button", { name: "Approve dispatch" });
  // Bring it to the bottom edge: scrolling further would pass the step and approve it by itself.
  await button.evaluate((el) => el.scrollIntoView({ block: "end" }));
  await expect(button).toBeVisible();
  await button.tap();
  await expect(page.locator("#services").getByText("› Approved", { exact: true })).toBeVisible({ timeout: 1500 });
  await ctx.close();
});
