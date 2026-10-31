import { expect, test, type Page } from "@playwright/test";
import { ensureImported, expectNoA11yViolations, expectToast } from "./helpers";

test.describe.configure({ mode: "serial" });

const enquiries = [
  { name: "Zara Khan", email: "zara@example.com", message: "We need an online store with order automation." },
  { name: "Adam Lee", email: "adam@example.com", message: "Looking for a school management system with fees." },
];

const showTable = async (page: Page) => {
  await page.getByRole("group", { name: "View" }).getByRole("button", { name: "Table" }).click();
  await expect(page.locator("table")).toBeVisible();
};

test("enquiries from the contact form land on the pipeline board", async ({ browser, page }) => {
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
  await expect(page.getByRole("heading", { name: "Leads", level: 1 })).toBeVisible();
  const fresh = page.getByRole("region", { name: /^New: / });
  await expect(fresh.getByRole("button", { name: /Zara Khan/ })).toBeVisible();
  await expect(fresh.getByRole("button", { name: /Adam Lee/ })).toBeVisible();
  // The sidebar counts who is waiting for a reply.
  await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: /Leads.*waiting for a reply/ })).toBeVisible();
  await expectNoA11yViolations(page);
});

test("table view: sorting, search and the reading panel", async ({ page }) => {
  await page.goto("/admin/inbox");
  await showTable(page);
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
  // Replying moves a new lead to Contacted and logs it on the timeline.
  await expect(panel.getByRole("radio", { name: "Contacted" })).toHaveAttribute("aria-checked", "true");
  await expect(panel.getByText("Replied · moved to Contacted")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByLabel("Search enquiries").fill("");
  await page.getByRole("tab", { name: /Replied/ }).click();
  await expect(page.locator("tbody tr").filter({ hasText: "Adam Lee" })).toHaveCount(1);
});

test("a lead moves through the pipeline with value, follow-up and notes", async ({ page }) => {
  await page.goto("/admin/inbox");
  await page.getByRole("group", { name: "View" }).getByRole("button", { name: "Board" }).click();
  await page.getByRole("region", { name: /^Contacted: / }).getByRole("button", { name: /Adam Lee/ }).click();
  const panel = page.getByRole("dialog");

  await panel.getByRole("radio", { name: "Proposal" }).click();
  await expectToast(page, "Moved to Proposal");
  await expect(panel.getByText("Contacted → Proposal")).toBeVisible();

  await panel.getByLabel("Deal value (USD)").fill("4500");
  await panel.getByLabel("Deal value (USD)").blur();
  await expectToast(page, "Value saved");
  await expect(panel.getByText("Value set to $4,500")).toBeVisible();

  await panel.getByRole("button", { name: "Tomorrow" }).click();
  await expectToast(page, "Follow-up: tomorrow");

  await panel.getByLabel("Add a note").fill("Sent the proposal PDF. Call on Friday.");
  await panel.getByRole("button", { name: "Add note" }).click();
  await expect(panel.getByText("Sent the proposal PDF. Call on Friday.")).toBeVisible();
  await page.keyboard.press("Escape");

  const proposal = page.getByRole("region", { name: /^Proposal: / });
  await expect(proposal.getByRole("button", { name: /Adam Lee/ })).toContainText("$4,500");
  await expect(proposal.getByRole("button", { name: /Adam Lee/ })).toContainText("Tomorrow");

  // The dashboard reads the same records.
  await page.goto("/admin");
  await expect(page.getByRole("region", { name: "Key numbers" })).toContainText("$4,500");
  await expect(page.getByText("Note on Adam Lee: Sent the proposal PDF. Call on Friday.")).toBeVisible();
});

test("Add lead validates, then saves a lead from WhatsApp", async ({ page }) => {
  await page.goto("/admin/inbox?new=1");
  const dialog = page.getByRole("dialog", { name: "Add a lead" });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/inbox$/); // the query is dropped once handled

  await dialog.getByRole("button", { name: "Add lead" }).click();
  await expect(dialog.getByText("Add their name")).toBeVisible();

  await dialog.getByLabel("Name").fill("Sara Malik");
  await dialog.getByRole("button", { name: "Add lead" }).click();
  await expect(dialog.getByText("Add an email or a phone number")).toBeVisible();

  await dialog.getByLabel("Phone / WhatsApp").fill("+92 300 1234567");
  await dialog.getByLabel("Company").fill("Malik Foods");
  await dialog.getByLabel("Deal value (USD)").fill("2800");
  await expectNoA11yViolations(page, "[role=dialog]");
  await dialog.getByRole("button", { name: "Add lead" }).click();
  await expectToast(page, "Sara Malik added");

  await expect(page.getByRole("region", { name: /^New: / }).getByRole("button", { name: /Sara Malik/ })).toContainText("$2,800");
});

test("Ctrl+K finds a lead and opens it", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "Search and commands" });
  await expect(palette).toBeVisible();
  await palette.getByRole("combobox").fill("sara");
  // Plain matching: only things that contain the words, not fuzzy lookalikes.
  await expect(palette.getByRole("option", { name: /Dashboard/ })).toHaveCount(0);
  await palette.getByRole("option", { name: /Sara Malik/ }).click();
  await expect(page).toHaveURL(/\/admin\/inbox/);
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Sara Malik" })).toBeVisible();
});

test("dark mode is remembered and stays accessible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-admin-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-admin-theme", "dark");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expectNoA11yViolations(page);
  await page.goto("/admin/inbox");
  await expectNoA11yViolations(page);
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-admin-theme", "light");
});

test("leaving the admin hands the public site a clean page", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.locator("html")).toHaveAttribute("data-admin-theme", /light|dark/);
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-admin-theme", /.+/);
});
