import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers";

// Visitors are signed out.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("public site", () => {
  for (const path of ["/", "/work", "/work/brands-attire", "/work/sky-tech"]) {
    test(`${path} renders and passes accessibility checks`, async ({ page }) => {
      test.slow(); // axe on the full homepage takes a while on low-power machines
      await page.emulateMedia({ reducedMotion: "reduce" });
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("main h1, main h2").first()).toBeVisible();
      await expectNoA11yViolations(page);
    });
  }

  test("unknown pages return 404 with the custom page", async ({ page }) => {
    const res = await page.goto("/no-such-page");
    expect(res?.status()).toBe(404);
    // The screen prints the address the visitor typed, not the internal route.
    await expect(page.locator(".sr-only", { hasText: "Lost signal at /no-such-page" })).toHaveCount(1);
  });

  test("admin libraries never reach visitors, and the JS budget holds", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const scripts = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .filter((e) => (e as PerformanceResourceTiming).initiatorType === "script")
        .map((e) => ({ url: e.name, size: (e as PerformanceResourceTiming).decodedBodySize })),
    );
    // Budget: the compressed scripts the HTML asks for up front (what blocks a
    // visitor's first interaction). Code loaded later on demand (Motion's
    // animation engine, GSAP Flip/MorphSVG/ScrambleText) is not counted.
    // 333 KB before the Phase 5 split, 281 KB after it; React and Next.js
    // themselves are about 113 KB of that. Anything beyond needs a reason.
    const html = await (await page.request.get("/")).text();
    const initial = [...html.matchAll(/<script src="([^"]+\.js)" async/g)].map((m) => m[1]);
    let gz = 0;
    for (const src of initial) gz += gzipSync(await (await page.request.get(src)).body()).length;
    expect(Math.round(gz / 1024)).toBeLessThanOrEqual(300);

    // React Hook Form and TanStack Table are admin-only: none of their code ships here.
    for (const { url } of scripts) {
      const body = await (await page.request.get(url)).text();
      expect(body, url).not.toContain("getPrePaginatedRowModel"); // TanStack Table
      expect(body, url).not.toContain("shouldUnregister"); // React Hook Form
    }
  });

  test("contact form sends an enquiry", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#contact");
    const form = page.locator("#contact form");
    await form.locator("#f-name").fill("Public Test");
    await form.locator("#f-email").fill("public@example.com");
    await form.locator("#f-msg").fill("We need a booking system with automated reminders for our clinic.");
    await form.getByRole("button", { name: /send/i }).click();
    await expect(page.getByText("Message received").first()).toBeVisible();
  });
});
