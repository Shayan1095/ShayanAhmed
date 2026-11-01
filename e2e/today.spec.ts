import { expect, test } from "@playwright/test";
import { ensureImported, expectNoA11yViolations, expectToast } from "./helpers";

test.describe.configure({ mode: "serial" });

test("Analytics shows the instruments (or how to switch them on)", async ({ page }) => {
  await ensureImported(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/admin/analytics");
  await expect(page.getByRole("heading", { name: "Analytics", level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Analytics" })).toHaveAttribute("aria-current", "page");
  await expectNoA11yViolations(page);
});

test("Today: plan the day, finish a top-3 task, tick a habit, close the day", async ({ page }) => {
  // A whole day's journey: many saves to the remote test database.
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  // A task to plan around.
  await page.goto("/admin/planner");
  await page.getByLabel("New task").fill("E2E: today's main task");
  // The board shows new tasks straight away and saves in the background (a server action POST):
  // wait for that save to finish before leaving, or the navigation cancels it.
  const saved = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/admin/planner"), { timeout: 45_000 });
  await page.getByLabel("New task").press("Enter");
  expect((await saved).ok()).toBe(true);
  await expect(page.getByText("E2E: today's main task").first()).toBeVisible();

  await page.goto("/admin/planner/today");
  await expect(page.getByRole("navigation", { name: "Planner" }).getByRole("link", { name: "Today" })).toHaveAttribute("aria-current", "page");

  // Morning: intention + top 3.
  await page.getByLabel("Today's one thing").fill("Ship one real thing");
  await page.getByLabel("Today's one thing").press("Enter");
  await page.getByRole("button", { name: /E2E: today's main task/, pressed: false }).click();
  await page.getByRole("button", { name: "Lock in" }).click();
  await expectToast(page, "Top 3 locked in");

  // Finish it from the top 3: points and the daily count go up.
  await page.getByRole("checkbox", { name: /E2E: today's main task/ }).first().click();
  await expectToast(page, /\+10 · E2E: today's main task/);
  await expect(page.getByRole("region", { name: "Today at a glance" })).toContainText(/[1-9]\d*\/3 tasks done/);

  // A habit.
  const habit = page.getByRole("checkbox", { name: "Reply to every lead" });
  await habit.click();
  await expect(habit).toHaveAttribute("aria-checked", "true");

  await expectNoA11yViolations(page);

  // Evening review needs an energy rating, then closes the day.
  await page.getByRole("button", { name: "Close the day" }).click();
  await expect(page.getByText("Rate your energy first")).toBeVisible();
  await page.getByLabel("Today's win").fill("Shipped the main task early");
  await page.getByRole("radio", { name: "Good" }).click();
  await page.getByRole("button", { name: "Close the day" }).click();
  await expectToast(page, "+10 · Day closed");
  await expect(page.getByText(/Day closed · [1-9]\d* done/)).toBeVisible();

  // Everything persists across a reload.
  await page.reload();
  await expect(page.getByLabel("Today's one thing")).toHaveValue("Ship one real thing");
  await expect(page.getByRole("checkbox", { name: "Reply to every lead" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText(/Day closed/)).toBeVisible();
});
