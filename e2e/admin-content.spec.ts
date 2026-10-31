import { expect, test, type Page } from "@playwright/test";
import { ensureImported, expectNoA11yViolations, expectToast } from "./helpers";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await ensureImported(page);
});

/** A small real PNG to upload, made by screenshotting the page. */
async function pngFrom(page: Page) {
  return {
    name: "shot.png",
    mimeType: "image/png",
    buffer: await page.screenshot({ clip: { x: 0, y: 0, width: 640, height: 400 } }),
  };
}

test.describe("projects", () => {
  test("Add project validates fields inline before saving", async ({ page }) => {
    await page.goto("/admin/projects/new");
    await expect(page.getByRole("navigation", { name: "Section" }).getByRole("link", { name: "Add project" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    const slug = page.getByLabel("URL slug");
    await page.getByLabel("Title").fill("E2E Store");
    await expect(slug).toHaveValue("e2e-store"); // filled from the title

    await slug.fill("Bad Slug!");
    await slug.blur();
    await expect(page.getByText("Use lowercase letters, numbers and dashes only")).toBeVisible();
    await expect(slug).toHaveAttribute("aria-invalid", "true");

    await page.getByLabel("Live URL").fill("not a url");
    await page.getByLabel("Live URL").blur();
    await expect(page.getByText("Enter a full URL, starting with https://")).toBeVisible();

    // Submitting with errors is blocked and the save bar says why.
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByRole("status").filter({ hasText: /fields? need/ })).toBeVisible();

    await slug.fill("e2e-store");
    await page.getByLabel("Live URL").fill("https://example.com");
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page).toHaveURL(/\/admin\/projects\/[a-f0-9]{24}$/);
    await expectToast(page, "Saved as a draft");
    await expect(page.getByRole("status").filter({ hasText: "All changes saved" })).toBeVisible();
  });

  test("a duplicate slug is reported on the slug field", async ({ page }) => {
    await page.goto("/admin/projects/new");
    await page.getByLabel("Title").fill("Another");
    await page.getByLabel("URL slug").fill("brands-attire");
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByRole("main").getByText("Another project already uses this slug.")).toBeVisible();
  });

  test("Screenshots tab uploads, replaces and removes images", async ({ page, request }) => {
    await page.goto("/admin/projects/screenshots");
    const first = page.locator("main section").first();
    const fileInputs = first.locator('input[type="file"]');

    await fileInputs.nth(0).setInputFiles(await pngFrom(page));
    const img = first.locator("img").first();
    await expect(img).toHaveAttribute("src", /^\/api\/media\/[a-f0-9]{24}$/);
    const firstSrc = (await img.getAttribute("src"))!;
    const media = await request.get(firstSrc);
    expect(media.status()).toBe(200);
    expect(media.headers()["content-type"]).toBe("image/png");

    await fileInputs.nth(0).setInputFiles(await pngFrom(page));
    await expect(img).not.toHaveAttribute("src", firstSrc);
    expect((await request.get(firstSrc)).status()).toBe(404); // the replaced upload was deleted

    await first.getByRole("button", { name: "Remove customer view" }).click();
    await expect(first.locator("img")).toHaveCount(0);
  });

  test("project list and editor pass accessibility checks", async ({ page }) => {
    await page.goto("/admin/projects");
    await expectNoA11yViolations(page);
    await page.locator("a[href^='/admin/projects/'][class*='font-semibold']").first().click();
    await expect(page).toHaveURL(/\/admin\/projects\/[a-f0-9]{24}$/);
    await expectNoA11yViolations(page);
  });
});

test.describe("testimonials", () => {
  test("Add testimonial: required fields and consent gate", async ({ page }) => {
    await page.goto("/admin/testimonials/new");
    await page.getByRole("button", { name: "Add testimonial" }).click();
    await expect(page.getByText("Add the quote")).toBeVisible();
    await expect(page.getByText("Add a name")).toBeVisible();

    await page.getByLabel("Quote").fill("Orders that took hours now take minutes.");
    await page.getByLabel("Name").fill("E2E Client");
    const published = page.getByRole("switch", { name: "Published" });
    await expect(published).toBeDisabled();
    await page.getByRole("switch", { name: "The client agreed to publish this" }).click();
    await expect(published).toBeEnabled();
    await published.click();
    await page.getByRole("button", { name: "Add testimonial" }).click();
    await expect(page).toHaveURL(/\/admin\/testimonials$/);
    await expect(page.getByText("E2E Client")).toBeVisible();
    await expectNoA11yViolations(page);
  });
});

test.describe("settings", () => {
  test("validates inline and saves repeatedly", async ({ page }) => {
    await page.goto("/admin/settings");
    const email = page.getByLabel("Email");
    await email.fill("not-an-email");
    await email.blur();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await email.fill("hello@example.com");

    const availability = page.getByLabel("Availability line");
    for (const text of ["Booking for January", "Taking new projects"]) {
      await availability.fill(text);
      await page.getByRole("button", { name: "Save settings" }).click();
      await expectToast(page, "Settings saved and live");
    }
    await expect(page.getByRole("status").filter({ hasText: "All changes saved" })).toBeVisible();
  });
});
