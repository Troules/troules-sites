import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { liveSites } from "@troules/registry";

test("lists every live site with a working link", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Troules" })).toBeVisible();
  for (const site of liveSites()) {
    await expect(page.getByRole("link", { name: new RegExp(site.name) })).toHaveAttribute("href", site.url);
  }
});

test("shows the mandatory image credit", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Credit: NASA, ESA, CSA, STScI/)).toBeVisible();
});

test("has no detectable accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("sends security headers", async ({ request }) => {
  const res = await request.get("/");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  expect(res.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
});
