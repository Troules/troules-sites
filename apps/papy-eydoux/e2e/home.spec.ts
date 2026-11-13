import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("opens on the title, in French", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("heading", { level: 1, name: "Papy Eydoux à travers l’Histoire" })).toBeVisible();
});

test("shows every moment in chronological order, each with a date and a description", async ({ page }) => {
  await page.goto("/");
  const moments = page.locator("article[data-moment]");
  await expect(moments).toHaveCount(22);
  await expect(moments.first()).toHaveAttribute("id", "fond-diffus-cosmologique");
  await expect(moments.last()).toHaveAttribute("id", "seance-de-cinema");
  for (const moment of await moments.all()) {
    await expect(moment.locator(".date")).not.toBeEmpty();
    await expect(moment.locator(".description")).not.toBeEmpty();
    await expect(moment.getByRole("img")).toHaveAttribute("alt", /.{20,}/);
  }
});

test("the time rail jumps to a moment and marks it as current", async ({ page }) => {
  await page.goto("/");
  const rail = page.getByRole("navigation", { name: "Frise chronologique" });
  const link = rail.getByRole("link", { name: "Tour Eiffel" });
  await link.click();
  await expect(page.getByRole("heading", { level: 2, name: "Riveteur à cent mètres" })).toBeInViewport();
  await expect(link).toHaveAttribute("aria-current", "step");
});

test("is kept out of search engines", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
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
