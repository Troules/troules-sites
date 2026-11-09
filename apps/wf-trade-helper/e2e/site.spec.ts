import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Runs against the committed sample (src/fixtures), so the numbers are stable but not hard-coded here.
const axe = (page: Page) => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();

test.describe("dashboard", () => {
  test("shows a top list that sorts by each metric, max rank only", async ({ page }) => {
    await page.goto("/");
    const top10 = page.getByRole("region", { name: "Top 100" });
    await expect(top10.getByRole("tab", { name: "Plat/day" })).toHaveAttribute("aria-selected", "true");
    const table = top10.getByRole("tabpanel").getByRole("table");
    await expect(table.getByRole("row").nth(10).getByRole("cell").first()).toHaveText("10");
    await expect(table.getByText(/^Rank 0$/)).toHaveCount(0);

    await top10.getByRole("tab", { name: "Price" }).click();
    const priceTable = top10.getByRole("tabpanel").getByRole("table");
    await expect(priceTable.getByRole("columnheader", { name: /Median/ })).toHaveAttribute("aria-sort", "descending");

    await top10.getByRole("tab", { name: "Price" }).press("ArrowRight");
    await expect(top10.getByRole("tab", { name: "Volume" })).toBeFocused();
    await expect(top10.getByRole("tab", { name: "Volume" })).toHaveAttribute("aria-selected", "true");
  });

  test("links rows to item pages", async ({ page }) => {
    await page.goto("/");
    const first = page.getByRole("tabpanel").getByRole("row").nth(1).getByRole("link");
    const name = (await first.locator("span > span").first().textContent())!;
    await first.click();
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  });

  test("loads more rows as you scroll, without sideways scrolling", async ({ page }) => {
    await page.goto("/");
    const table = page.getByRole("region", { name: "Top 100" }).getByRole("tabpanel").getByRole("table");
    await table.getByRole("button", { name: /^Show \d+ more$/ }).scrollIntoViewIfNeeded();
    await expect(table.getByRole("row").nth(11).getByRole("cell").first()).toHaveText("11");
    await expect(page.getByText(/^Showing \d+ of \d+$/)).toBeAttached();
    const fits = await table.evaluate((t) => t.scrollWidth <= t.parentElement!.clientWidth);
    expect(fits).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("lists items near their 90-day high", async ({ page }) => {
    await page.goto("/");
    const top10 = page.getByRole("region", { name: "Top 100" });
    await top10.getByRole("tab", { name: "Near 90d high" }).click();
    const table = top10.getByRole("tabpanel").getByRole("table");
    await expect(table.getByRole("columnheader", { name: /vs 90d/ })).toHaveAttribute("aria-sort", "descending");
    await expect(table.getByRole("row").nth(1)).toContainText(/\d+%/);
  });

  test("shows rank-up profits and when the market pays more", async ({ page }) => {
    await page.goto("/");
    const rankUp = page.getByRole("region", { name: /Rank-up profit/ });
    await expect(rankUp.getByRole("row").nth(1)).toContainText(/\d+ × \d+p → rank \d/);
    const timing = page.getByRole("region", { name: /When to sell · whole market/ });
    for (const r of ["Europe evening", "Americas evening", "Asia & Oceania evening"])
      await expect(timing.getByText(new RegExp(`^${r}`))).toBeVisible();
    await expect(timing.getByRole("img", { name: /price by weekday/ })).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/");
    expect((await axe(page)).violations).toEqual([]);
  });
});

test.describe("item page", () => {
  test("shows numbers, a chart and a sell suggestion for the max rank first", async ({ page }) => {
    await page.goto("/items/arcane_energize");
    await expect(page.getByRole("heading", { level: 1, name: "Arcane Energize" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Rank 5 (max)" })).toHaveAttribute("aria-selected", "true");
    const panel = page.getByRole("tabpanel").first();
    await expect(panel.getByText("suggested price")).toBeVisible();
    await expect(panel.getByRole("link", { name: /Sell on warframe.market/ })).toHaveAttribute(
      "href",
      "https://warframe.market/items/arcane_energize",
    );
    await expect(panel.getByRole("img", { name: /last 90 days/ })).toBeVisible();
  });

  test("shows volatility, the 90-day position and when this item sells best", async ({ page }) => {
    await page.goto("/items/arcane_energize");
    const panel = page.getByRole("tabpanel").first();
    await expect(panel.getByText("Volatility, 90 days")).toBeVisible();
    await expect(panel.getByText("7d median vs 90 days")).toBeVisible();
    await expect(panel.getByRole("region", { name: /When to sell · rank 5/ })).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/items/arcane_energize");
    expect((await axe(page)).violations).toEqual([]);
  });

  test("answers unknown items with a real 404", async ({ page }) => {
    const res = await page.goto("/items/not_a_real_item");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Item not found" })).toBeVisible();
  });

  test("still renders catalog items without sample data", async ({ page }) => {
    const res = await page.goto("/items/secura_dual_cestra");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "No price history here yet" })).toBeVisible();
  });
});

test.describe("search", () => {
  test("opens with Ctrl+K, finds an item and opens it with Enter", async ({ page }) => {
    await page.goto("/");
    const box = page.getByRole("combobox", { name: "Item name" });
    // The shortcut listener attaches on hydration, which can trail the load event under a parallel run.
    await expect(async () => {
      await page.keyboard.press("Control+k");
      await expect(box).toBeFocused({ timeout: 1000 });
    }).toPass();
    await box.fill("wisp prime set");
    await expect(page.getByRole("option").first()).toHaveText(/Wisp Prime Set/);
    expect((await axe(page)).violations).toEqual([]);
    await box.press("Enter");
    await expect(page).toHaveURL(/\/items\/wisp_prime_set$/);
    await expect(page.getByRole("heading", { level: 1, name: "Wisp Prime Set" })).toBeVisible();
  });

  test("opens from the header button", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Search .* items/ }).click();
    await expect(page.getByRole("dialog", { name: "Search items" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test.describe("vosfor calculator", () => {
  test("ranks the nine collections and simulates the chosen one", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Vosfor calculator" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Vosfor calculator" })).toBeVisible();
    const ranking = page.getByRole("region", { name: "Collections by expected plat" });
    await expect(ranking.getByRole("row")).toHaveCount(10);
    await expect(ranking.getByRole("columnheader", { name: /Sell or dissolve/ })).toHaveAttribute(
      "aria-sort",
      "descending",
    );

    await page.getByLabel("Vosfor you have").fill("2000");
    await expect(page.getByText(/^= 10 packs/)).toBeVisible();

    await ranking.getByRole("button", { name: /Eidolon/ }).click();
    const details = page.getByRole("region", { name: "Eidolon Arcane Collection" });
    await expect(details.getByRole("row", { name: /Arcane Energize/ })).toContainText("Legendary");
    await expect(details.getByText("At least one Legendary")).toBeVisible();
    await expect(details.getByRole("row", { name: /Arcane Energize/ })).toContainText(/R5 · [\d.]+\/day/);
    await expect(details.getByRole("list", { name: "Arcanes to sell" }).getByRole("listitem").first()).toBeVisible();
    await expect(details.getByRole("row").nth(1).getByRole("cell", { name: "Sell", exact: true })).toBeVisible();

    await page.getByText("Sell everything", { exact: true }).click();
    await expect(ranking.getByRole("columnheader", { name: /Sell all/ })).toHaveAttribute("aria-sort", "descending");
    await expect(details.getByRole("columnheader", { name: "≥1 in 10 packs" })).toBeVisible();
    await expect(details.getByRole("cell", { name: "Dissolve" })).toHaveCount(0);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/vosfor");
    expect((await axe(page)).violations).toEqual([]);
  });
});

test("sends security headers", async ({ request }) => {
  const res = await request.get("/");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  expect(res.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
});
