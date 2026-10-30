import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers";

test.describe.configure({ mode: "serial" });

test("add a task, finish it, and see it in Progress", async ({ page }) => {
  await page.goto("/admin/planner");
  const add = page.getByLabel("New task");
  await add.fill("E2E: write the case study");
  await add.press("Enter");
  await expect(page.getByRole("button", { name: "E2E: write the case study", exact: true })).toBeVisible();
  await expectNoA11yViolations(page);

  await page.getByRole("button", { name: "Move E2E: write the case study" }).click();
  await page.getByRole("menuitem", { name: "Done" }).click();
  await expect(page.getByRole("region", { name: "Done" }).getByText("E2E: write the case study")).toBeVisible();

  await page.goto("/admin/planner/progress");
  await expect(page.getByText("Recently finished")).toBeVisible();
  await expect(page.getByText("E2E: write the case study")).toBeVisible();
  await expectNoA11yViolations(page);
});
