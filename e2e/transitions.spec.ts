import { expect, test, type Page } from "@playwright/test";

/**
 * Page transitions (build brief, Phase 4): internal links are client-side
 * routes (no document reload), going deeper is a "nav-forward" view
 * transition and "← All work" a "nav-back" one, the new page starts at the
 * top, and the intro never replays on client-side navigation.
 */

/** Marks the document and records every view transition and its types. */
async function instrument(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __doc: number; __vt: string[][] };
    w.__doc = 1; // survives only if the document is not reloaded
    w.__vt = [];
    const start = document.startViewTransition?.bind(document);
    if (!start) return;
    document.startViewTransition = ((arg: unknown) => {
      const types = (arg && typeof arg === "object" && "types" in arg ? (arg as { types?: string[] }).types : undefined) ?? [];
      w.__vt.push([...types]);
      return start(arg as Parameters<typeof start>[0]);
    }) as typeof document.startViewTransition;
  });
}
const sameDocument = (page: Page) => page.evaluate(() => (window as unknown as { __doc?: number }).__doc === 1);
const transitions = (page: Page) => page.evaluate(() => (window as unknown as { __vt: string[][] }).__vt);

test("hero → case study is a client-side route with a nav-forward transition, and back reverses it", async ({ page }) => {
  await page.goto("/");
  await instrument(page);
  await page.locator("[data-hero-cta]").getByRole("link", { name: /case study/i }).click();
  await expect(page).toHaveURL(/\/work\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await sameDocument(page)).toBe(true);
  await expect.poll(() => transitions(page)).toContainEqual(["nav-forward"]);
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  // The intro does not replay on client-side navigation.
  await expect(page.locator(".sa-pl-overlay")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.dataset.intro)).not.toBe("play");

  await page.getByRole("link", { name: "← All work" }).click();
  await expect(page).toHaveURL(/\/#work$/);
  expect(await sameDocument(page)).toBe(true);
  await expect.poll(() => transitions(page)).toContainEqual(["nav-back"]);
});

test("navbar Work opens /work without a reload", async ({ page }) => {
  await page.goto("/work/brands-attire");
  await instrument(page);
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Work" }).click();
  await expect(page).toHaveURL(/\/work$/);
  expect(await sameDocument(page)).toBe(true);
});
