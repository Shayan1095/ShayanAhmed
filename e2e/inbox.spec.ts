import { expect, test } from "@playwright/test";
import { ensureImported, expectNoA11yViolations } from "./helpers";

test.describe.configure({ mode: "serial" });

const enquiries = [
  { name: "Zara Khan", email: "zara@example.com", message: "We need an online store with order automation." },
  { name: "Adam Lee", email: "adam@example.com", message: "Looking for a school management system with fees." },
];

test("enquiries from the contact form land in the Inbox table", async ({ browser, page }) => {
  await ensureImported(page);
  const visitor = await browser.newContext({ storageState: { cookies: [], origins: [] }, reducedMotion: "reduce" });
  const site = await visitor.newPage();
  for (const e of enquiries) {
    await site.goto("/#contact");
    await site.locator("#f-name").fill(e.name);
    await site.locator("#f-email").fill(e.email);
    await site.locator("#f-msg").fill(e.message);
    await site.locator("#contact form").getByRole("button", { name: /send/i }).click();
    await expect(site.getByText("Message received").first()).toBeVisible();
  }
  await visitor.close();

  await page.goto("/admin/inbox");
  const rows = page.locator("tbody tr");
  await expect(rows.filter({ hasText: "Zara Khan" })).toHaveCount(1);
  await expect(rows.filter({ hasText: "Adam Lee" })).toHaveCount(1);
  await expectNoA11yViolations(page);
});

test("sorting, search and the reading panel", async ({ page }) => {
  await page.goto("/admin/inbox");
  const names = async () =>
    (await page.locator("tbody tr td:first-child button > span:first-child").allTextContents()).map((s) => s.trim());

  await page.getByRole("button", { name: "From" }).click();
  await expect(page.getByRole("columnheader", { name: "From" })).toHaveAttribute("aria-sort", "ascending");
  expect((await names()).filter((n) => ["Adam Lee", "Zara Khan"].includes(n))).toEqual(["Adam Lee", "Zara Khan"]);

  await page.getByRole("button", { name: "From" }).click();
  await expect(page.getByRole("columnheader", { name: "From" })).toHaveAttribute("aria-sort", "descending");

  await page.getByLabel("Search enquiries").fill("school");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.getByText("1 enquiry found")).toBeVisible();

  await page.locator("tbody tr").first().getByRole("button").click();
  const panel = page.getByRole("dialog");
  await expect(panel.getByRole("heading", { name: "Adam Lee" })).toBeVisible();
  await expectNoA11yViolations(page);
  await panel.getByRole("button", { name: "Mark replied" }).click();
  await page.keyboard.press("Escape");

  await page.getByLabel("Search enquiries").fill("");
  await page.getByRole("tab", { name: /Replied/ }).click();
  await expect(page.locator("tbody tr").filter({ hasText: "Adam Lee" })).toHaveCount(1);
});
