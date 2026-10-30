import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** WCAG A/AA check. Run on settled pages (reduced motion), so animations don't skew contrast. */
export async function expectNoA11yViolations(page: Page, include?: string) {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]);
  // Scope to a layer (e.g. an open panel) so covered content beneath it isn't measured.
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
}

/** Waits for a Sonner toast with this text. */
export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: text }).first()).toBeVisible();
}

/** Makes sure the starter content is in the test database (first-run import). */
export async function ensureImported(page: Page) {
  await page.goto("/admin");
  const importButton = page.getByRole("button", { name: "Import content" });
  if (await importButton.isVisible()) {
    await importButton.click();
    await expect(page.getByText("Import the site content")).toBeHidden({ timeout: 20_000 });
  }
}
