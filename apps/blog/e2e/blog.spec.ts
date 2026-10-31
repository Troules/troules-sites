import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const POST = "/how-this-blog-works";

test("home lists articles linking to their pages", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Field notes" })).toBeVisible();
  await page.getByRole("link", { name: "How this blog works" }).click();
  await expect(page).toHaveURL(POST);
});

test("article renders images, Mermaid diagrams and alerts", async ({ page }) => {
  await page.goto(POST);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How this blog works");
  const img = page.getByRole("img", { name: "The publishing pipeline at a glance" });
  await expect(img).toBeVisible();
  expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator("figure.mermaid svg")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".markdown-alert-note")).toBeVisible();
});

for (const path of ["/", POST, "/tags"]) {
  test(`no accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    if (path === POST) await page.locator("figure.mermaid svg").waitFor({ timeout: 15_000 });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("serves an RSS feed and a sitemap", async ({ request }) => {
  const feed = await request.get("/feed.xml");
  expect(feed.headers()["content-type"]).toContain("application/rss+xml");
  expect(await feed.text()).toContain("<title>How this blog works</title>");
  expect(await (await request.get("/sitemap.xml")).text()).toContain(POST);
});

test("unknown articles and tags return a real 404 page", async ({ request }) => {
  for (const path of ["/does-not-exist", "/tags/does-not-exist", "/a/b"]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(404);
    expect(await res.text()).toContain("Not found");
  }
});

test("sends security headers", async ({ request }) => {
  const res = await request.get("/");
  expect(res.headers()["x-frame-options"]).toBe("DENY");
  expect(res.headers()["content-security-policy"]).toContain("object-src 'none'");
});
