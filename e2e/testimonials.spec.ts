import { expect, test } from "@playwright/test";
import { ensureImported, expectNoA11yViolations } from "./helpers";

/**
 * Testimonials (build brief, Phase 3): added in the admin with a star rating,
 * country, review link and linked project; shown after the case studies on
 * the home page and inside the linked case study; initials when there is no
 * photo. The test removes its testimonial at the end.
 */
test.describe.configure({ mode: "serial" });

const NAME = "E2E Rated Client";

test("admin: add a rated testimonial linked to a project", async ({ page }) => {
  await ensureImported(page);
  await page.goto("/admin/testimonials/new");
  await page.getByLabel("Quote").fill("Clear milestones and a live link every week.");
  await page.getByLabel("Name").fill(NAME);
  await page.getByLabel("Role").fill("Founder");
  await page.getByLabel("Company").fill("E2E Co");
  await page.getByLabel("Country").fill("Pakistan");
  await page.getByLabel("Link to the original review").fill("https://www.upwork.com/e2e-review");
  await page.getByRole("radio", { name: "4 stars" }).check({ force: true });
  await expect(page.getByText("4 out of 5")).toBeVisible();
  await page.getByRole("combobox", { name: "Linked project" }).click();
  await page.getByRole("option", { name: "Brands Attire" }).click();
  await page.getByRole("switch", { name: "The client agreed to publish this" }).click();
  await page.getByRole("switch", { name: "Published" }).click();
  await page.getByRole("button", { name: "Add testimonial" }).click();
  await expect(page).toHaveURL(/\/admin\/testimonials$/);
  await expect(page.getByText(NAME)).toBeVisible();
});

test("home: right after the case studies, with rating, initials, country and review link", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#testimonials");
  await expect(section).toBeVisible();
  // Placed straight after Selected work.
  // (The pinned work section may sit inside GSAP's pin spacer.)
  expect(
    await section.evaluate((el) => {
      const prev = el.previousElementSibling;
      return prev?.id === "work" || Boolean(prev?.querySelector(":scope > #work"));
    }),
  ).toBe(true);
  const card = section.locator("figure", { hasText: NAME });
  await expect(card.getByLabel("Rated 4 out of 5")).toBeVisible();
  await expect(card.getByText("ER", { exact: true })).toBeVisible(); // initials, no photo
  await expect(card.getByText("Founder, E2E Co")).toBeVisible();
  await expect(card.getByText("Pakistan")).toBeVisible();
  await expect(card.getByRole("link", { name: /Original review on upwork\.com/ })).toHaveAttribute("href", "https://www.upwork.com/e2e-review");
  await section.scrollIntoViewIfNeeded();
  await expectNoA11yViolations(page, "#testimonials");
});

test("case study: the linked project shows it too", async ({ page }) => {
  await page.goto("/work/brands-attire");
  await expect(page.locator("#case-testimonials figure", { hasText: NAME })).toBeVisible();
});

test("cleanup: delete the testimonial", async ({ page }) => {
  await page.goto("/admin/testimonials");
  await page.getByRole("button", { name: `Delete testimonial from ${NAME}` }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText(NAME)).toHaveCount(0);
});
