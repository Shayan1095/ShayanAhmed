import { expect, test } from "@playwright/test";
import { ensureImported } from "./helpers";

/**
 * Intro video (Admin → Settings): a saved link puts the video in the
 * "Meet the builder" frame; cleared, the frame shows the logo again.
 */
test.describe.configure({ mode: "serial" });

const SRC = `/videos/e2e-intro-${Date.now()}.mp4`; // fresh each run, so the form always has a change to save
const POSTER = "/videos/e2e-intro-poster.webp";

async function setVideo(page: import("@playwright/test").Page, src: string, poster: string) {
  await page.goto("/admin/settings");
  await page.getByLabel("Video link (MP4)").fill(src);
  await page.getByLabel("Poster image link").fill(poster);
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Settings saved and live")).toBeVisible();
}

test("admin: a saved intro video shows in Meet the builder", async ({ page }) => {
  await ensureImported(page);
  await page.goto("/admin/settings");
  await page.getByLabel("Video link (MP4)").fill("not a link");
  await page.getByLabel("Poster image link").focus();
  await expect(page.getByText("Use a full https:// URL or a path starting with /").first()).toBeVisible();

  await setVideo(page, SRC, POSTER);
  await page.goto("/");
  const video = page.locator("#builder video");
  await expect(video).toHaveAttribute("poster", POSTER);
  await expect(page.locator("#builder")).not.toContainText("on its way");
});

test("cleanup: clearing the link brings the logo back", async ({ page }) => {
  await setVideo(page, "", "");
  await page.goto("/");
  await expect(page.locator("#builder video")).toHaveCount(0);
});
