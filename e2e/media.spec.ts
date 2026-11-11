import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { ensureImported, expectToast } from "./helpers";

/**
 * Project media (build brief, Phase 2): poster and recording on the home case
 * frame and the footer tiles; play only while half on screen; never with
 * reduced motion or Data Saver. The recording is a short WebM recorded by the
 * test browser from a canvas and served by the test (no video files in the repo).
 */
test.describe.configure({ mode: "serial" });

const CLIP_URL = "https://media.e2e.test/clip.webm";
let clip: Buffer;

/** A real, playable WebM: one second of a moving square, recorded in the browser. */
async function recordClip(page: Page) {
  const base64 = await page.evaluate(async () => {
    const canvas = Object.assign(document.createElement("canvas"), { width: 160, height: 100 });
    const ctx = canvas.getContext("2d")!;
    const rec = new MediaRecorder(canvas.captureStream(20), { mimeType: "video/webm" });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));
    rec.start();
    const t0 = performance.now();
    await new Promise<void>((resolve) => {
      const draw = (t: number) => {
        ctx.fillStyle = "#1a1511";
        ctx.fillRect(0, 0, 160, 100);
        ctx.fillStyle = "#c9853f";
        ctx.fillRect(((t - t0) / 8) % 140, 40, 20, 20);
        if (t - t0 < 1000) requestAnimationFrame(draw);
        else resolve();
      };
      requestAnimationFrame(draw);
    });
    rec.stop();
    await done;
    const buf = new Uint8Array(await new Blob(chunks, { type: "video/webm" }).arrayBuffer());
    let s = "";
    buf.forEach((b) => (s += String.fromCharCode(b)));
    return btoa(s);
  });
  return Buffer.from(base64, "base64");
}

async function serveClip(context: BrowserContext) {
  await context.route(`${CLIP_URL}*`, (route) => route.fulfill({ status: 200, contentType: "video/webm", body: clip }));
}

async function openBrandsAttire(page: Page) {
  await page.goto("/admin/projects");
  await page.getByRole("link", { name: "Brands Attire", exact: true }).first().click();
  await expect(page).toHaveURL(/\/admin\/projects\/[a-f0-9]{24}$/);
}

/** The home case frame for Brands Attire (its monitor screen). */
const frame = (page: Page) => page.locator('[aria-labelledby="work-brands-attire"]').first();

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto("about:blank");
  clip = await recordClip(page);
  await page.close();
});

test("admin: add a poster and a recording to a project", async ({ page }) => {
  await ensureImported(page);
  await openBrandsAttire(page);
  const poster = page.getByRole("group", { name: "Poster" });
  await poster.locator('input[type="file"]').setInputFiles({
    name: "poster.png",
    mimeType: "image/png",
    buffer: await page.screenshot({ clip: { x: 0, y: 0, width: 640, height: 400 } }),
  });
  await expect(poster.locator("img")).toHaveAttribute("src", /^\/api\/media\/[a-f0-9]{24}$/, { timeout: 30_000 });
  await page.getByRole("group", { name: "Main recording" }).getByLabel("WebM link").fill(CLIP_URL);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expectToast(page, /saved/i);
});

test("the case frame shows the poster and plays only while half on screen", async ({ page, context }) => {
  await serveClip(context);
  await page.goto("/");
  const f = frame(page);
  await f.scrollIntoViewIfNeeded();
  await expect(f.locator("img[src*='api%2Fmedia'], img[src*='/api/media/']").first()).toBeVisible();
  const video = f.locator("video");
  await expect(video).toHaveCount(1);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused), { timeout: 15_000 }).toBe(true);
  // Off screen: paused.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused), { timeout: 10_000 }).toBe(true);
});

test("no autoplay with reduced motion or Data Saver: the poster shows instead", async ({ browser }) => {
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const saver = await browser.newContext();
  await saver.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true } }));
  for (const ctx of [reduced, saver]) {
    await serveClip(ctx);
    const page = await ctx.newPage();
    await page.goto("/");
    const f = frame(page);
    await f.scrollIntoViewIfNeeded();
    await expect(f.locator("img").first()).toBeVisible();
    await expect(f.locator("video")).toHaveCount(0);
    await ctx.close();
  }
});

test("footer tiles show the poster and play the recording on hover", async ({ page, context }) => {
  await serveClip(context);
  await page.goto("/work");
  const tile = page.locator('footer section[aria-labelledby="footer-work"] li').first();
  await tile.scrollIntoViewIfNeeded();
  await expect(tile.locator("img").first()).toBeVisible();
  const video = tile.locator("video");
  await expect(video).toHaveCount(1);
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true); // not before hover
  await tile.hover();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused), { timeout: 15_000 }).toBe(true);
});

test("cleanup: remove the media again", async ({ page }) => {
  await openBrandsAttire(page);
  await page.getByRole("group", { name: "Poster" }).getByRole("button", { name: "Remove" }).click();
  await page.getByRole("group", { name: "Main recording" }).getByLabel("WebM link").fill("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expectToast(page, /saved/i);
});
