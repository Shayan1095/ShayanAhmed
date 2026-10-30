import { expect, test as setup } from "@playwright/test";
import { E2E } from "../playwright.config";

/** Signs in once and saves the session for every admin test. */
setup("sign in as admin", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Email").fill(E2E.email);
  await page.getByLabel("Password").fill(E2E.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await page.context().storageState({ path: "e2e/.auth/admin.json" });
});
