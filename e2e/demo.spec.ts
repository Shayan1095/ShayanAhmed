import { expect, test, type Page } from "@playwright/test";

/**
 * Playable demo (build brief, Phase 5): the agent feed works with mouse,
 * touch and keyboard and announces each change; the order flow's "Approve
 * dispatch" plays the dispatch step straight away.
 */

const feed = (page: Page) => page.locator("#builder");
// One card at a time: wait out the outgoing card before acting.
const only = async (page: Page, name: RegExp) => {
  const b = feed(page).getByRole("button", { name });
  await expect(b).toHaveCount(1);
  return b;
};
const leftCount = async (page: Page) => Number((await feed(page).getByText(/^\d+ left$/).textContent())?.split(" ")[0]);

test("agent feed: approve stamps, skip slides out, the queue empties and replays (mouse)", async ({ page }) => {
  await page.goto("/");
  await feed(page).scrollIntoViewIfNeeded();
  await expect(feed(page).getByText("Example data")).toBeVisible();
  const total = await leftCount(page);
  expect(total).toBeGreaterThan(1);

  await (await only(page, /^Approve:/)).click();
  await expect(feed(page).getByRole("status")).toContainText("Approved:");
  await expect.poll(() => leftCount(page)).toBe(total - 1);

  await (await only(page, /^Skip:/)).click();
  await expect(feed(page).getByRole("status")).toContainText("Skipped:");

  // Finish the queue.
  for (let i = 2; i < total; i++) {
    await (await only(page, /^Approve:/)).click();
    await expect.poll(() => leftCount(page).catch(() => 0)).toBeLessThanOrEqual(total - i);
  }
  await expect(feed(page).getByText(new RegExp(`Queue clear: ${total - 1} approved, 1 skipped\\.`))).toBeVisible();
  await expect(feed(page).getByRole("link", { name: /See the .* build/ })).toBeVisible();
  await feed(page).getByRole("button", { name: "Replay" }).click();
  await expect.poll(() => leftCount(page)).toBe(total);
});

test("agent feed: keyboard only, focus follows to the next card", async ({ page }) => {
  await page.goto("/");
  const approve = feed(page).getByRole("button", { name: /^Approve:/ });
  await approve.focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? ""))
    .toMatch(/^Approve:/);
  await page.keyboard.press("Tab"); // to Skip
  await page.keyboard.press("Enter");
  await expect(feed(page).getByRole("status")).toContainText("Skipped:");
});

test("agent feed: touch", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto("/");
  await feed(page).scrollIntoViewIfNeeded();
  const total = await leftCount(page);
  await feed(page).getByRole("button", { name: /^Approve:/ }).tap();
  await expect.poll(() => leftCount(page)).toBe(total - 1);
  await ctx.close();
});

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
