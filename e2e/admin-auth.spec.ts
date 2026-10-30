import { expect, test } from "@playwright/test";
import { E2E } from "../playwright.config";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("admin access", () => {
  for (const path of ["/admin", "/admin/inbox", "/admin/projects/screenshots", "/admin/planner"]) {
    test(`${path} redirects signed-out visitors to sign-in`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    });
  }

  test("a wrong password is rejected and the email is kept", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(E2E.email);
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("That email and password don't match.");
    await expect(page.getByLabel("Email")).toHaveValue(E2E.email);
  });

  test("login page looks right", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page).toHaveScreenshot("login.png");
  });

  test("unknown media ids return 404", async ({ request }) => {
    expect((await request.get("/api/media/000000000000000000000000")).status()).toBe(404);
    expect((await request.get("/api/media/not-an-id")).status()).toBe(404);
  });
});
