import { expect, test } from "@playwright/test";

/**
 * Signature and tactile details (build brief, Phase 7): the masthead light,
 * the magnetic CTA (8px at most), the "Open case →" pill over case frames
 * only, and the keycap press.
 */
test("masthead light follows the pointer", async ({ page }) => {
  await page.goto("/");
  const mast = page.locator("[data-hero-masthead]");
  const box = (await mast.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2, { steps: 4 });
  await expect.poll(() => mast.evaluate((el) => parseFloat(el.style.getPropertyValue("--my")) || -999)).toBeGreaterThan(0);
});

test("hero CTA leans toward the pointer, never more than 8px", async ({ page }) => {
  await page.goto("/");
  const wrap = page.locator("[data-hero-cta] [data-magnetic]");
  await wrap.scrollIntoViewIfNeeded();
  const box = (await wrap.boundingBox())!;
  await page.mouse.move(box.x + box.width - 1, box.y + box.height - 1);
  await expect.poll(() => wrap.evaluate((el) => el.style.transform)).toMatch(/translate/);
  const [x, y] = (await wrap.evaluate((el) => el.style.transform)).match(/-?[\d.]+/g)!.map(Number);
  expect(Math.abs(x)).toBeLessThanOrEqual(8);
  expect(Math.abs(y)).toBeLessThanOrEqual(8);
});

test("'Open case' pill shows over case frames only", async ({ page }) => {
  await page.goto("/work");
  const pill = page.locator("[data-case-cursor]");
  await page.mouse.move(5, 5);
  await expect(pill).toHaveCSS("opacity", "0");
  const frame = page.locator("[data-case-frame]").first();
  const box = (await frame.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 3 });
  await expect(pill).toHaveAttribute("data-on", "");
});

test("buttons press down 2px", async ({ page }) => {
  await page.goto("/");
  const btn = page.locator("#work a[class*='active:translate-y-0.5']").first();
  await btn.scrollIntoViewIfNeeded();
  const box = (await btn.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(() => btn.evaluate((el) => getComputedStyle(el).translate)).toBe("0px 2px");
  await page.mouse.up();
});
