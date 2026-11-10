import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Runs against the committed sample (src/fixtures), so the numbers are stable but not hard-coded here.
const axe = (page: Page) => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
const fitsViewport = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

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

  test("narrows the top list to one item type and keeps the type across sorts", async ({ page }) => {
    await page.goto("/");
    const top = page.getByRole("region", { name: "Top 100" });
    const sets = top.getByRole("button", { name: "Sets", exact: true });
    // The click only counts once the page has hydrated.
    await expect(async () => {
      await sets.click();
      await expect(sets).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
    }).toPass();
    const panel = top.getByRole("tabpanel");
    await expect(panel.getByRole("row").nth(1)).toContainText("Prime Set");
    await expect(panel.getByRole("link").filter({ hasNotText: "Prime Set" })).toHaveCount(0);
    await top.getByRole("tab", { name: "Volume" }).click();
    await expect(sets).toHaveAttribute("aria-pressed", "true");
    await expect(panel.getByRole("row").nth(1)).toContainText("Prime Set");
    await top.getByRole("button", { name: "All", exact: true }).click();
    await expect(panel.getByRole("row").nth(10).getByRole("cell").first()).toHaveText("10");
    expect(await fitsViewport(page)).toBe(true);
  });

  test("shows the week's movers and what each calculator says today", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "What sells in Warframe right now" })).toBeVisible();
    await expect(page.getByRole("img", { name: /\d+ rising, \d+ steady, \d+ falling/ })).toBeVisible();
    const movers = page.getByRole("region", { name: "Movers this week" });
    await expect(movers.getByRole("heading", { name: "Rising" })).toBeVisible();
    await expect(movers.getByRole("link").first()).toContainText(/▲ \d/);
    await expect(movers.getByRole("link").last()).toContainText(/▼ \d/);
    const tools = page.getByRole("region", { name: "Calculators" });
    await expect(tools.getByRole("link", { name: /Set or parts\?/ })).toHaveAttribute("href", "/sets");
    await expect(tools.getByRole("link", { name: /Ducats for Baro/ })).toContainText(/\d+ ducats for \d+p/);
    await expect(tools.getByRole("link", { name: /Vosfor packs/ })).toContainText(/pays about \d+p a pack/);
    await expect(
      page.getByRole("region", { name: "My stash" }).getByRole("link", { name: "Start my stash" }),
    ).toBeVisible();
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

  test("reads the price chart day by day from the keyboard and switches period", async ({ page }) => {
    await page.goto("/items/arcane_energize");
    const history = page
      .getByRole("tabpanel")
      .first()
      .getByRole("region", { name: /Price history/ });
    const chart = history.getByRole("group", { name: /Price chart/ });
    const readout = history.locator("[aria-live]");
    await expect(readout).toHaveText(/\d+p.*\d+–\d+p, \d+ trades?/);
    const latest = (await readout.textContent())!;
    await expect(async () => {
      await chart.focus();
      await chart.press("ArrowLeft");
      await expect(readout).not.toHaveText(latest, { timeout: 1000 });
    }).toPass();
    await chart.press("End");
    await expect(readout).toHaveText(latest);
    await history.getByRole("button", { name: "7 days" }).click();
    await expect(history.getByRole("img", { name: /last 7 days/ })).toBeVisible();
  });

  test("offers a trade-chat message and adds the item to the stash", async ({ page }) => {
    await page.goto("/items/arcane_energize");
    const panel = page.getByRole("tabpanel").first();
    await expect(panel.getByText(/^WTS \[Arcane Energize\] R5 \d+p$/)).toBeVisible();
    await panel.getByRole("button", { name: "Add to my stash" }).click();
    await panel.getByRole("button", { name: "One more in my stash" }).click();
    await expect(page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: /Stash/ })).toContainText(
      "1",
    );
    await panel.getByRole("link", { name: "In my stash" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "My stash" })).toBeVisible();
    await expect(page.getByRole("row", { name: /Arcane Energize/ }).getByRole("spinbutton")).toHaveValue("2");
  });

  test("shows a part's ducats, its set and what the parts add up to", async ({ page }) => {
    await page.goto("/items/dual_kamas_prime_blade");
    await expect(page.getByText(/worth 100 ducats at Baro/)).toBeVisible();
    const set = page.getByRole("region", { name: "Set or parts" });
    await expect(set.getByRole("row", { name: /Dual Kamas Prime Blade/ })).toContainText("× 2");
    await expect(set.getByRole("row", { name: /All parts/ })).toContainText(/\d+p/);
    await set.getByRole("link", { name: "Dual Kamas Prime Set" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Dual Kamas Prime Set" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Set or parts" })).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/items/arcane_energize");
    expect((await axe(page)).violations).toEqual([]);
    expect(await fitsViewport(page)).toBe(true);
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

test.describe("stash", () => {
  test("adds items, values them, writes the trade-chat message and survives a reload", async ({ page }) => {
    await page.goto("/stash");
    await expect(page.getByRole("heading", { name: "Nothing in your stash yet" })).toBeVisible();
    const box = page.getByRole("combobox", { name: "Add an item you want to sell" });
    await box.fill("arcane energize");
    await page.getByRole("option", { name: /Arcane Energize/ }).click();
    const row = page.getByRole("row", { name: /Arcane Energize/ });
    await expect(row.getByRole("combobox", { name: "Rank or type of Arcane Energize" })).toHaveValue("5|null");
    const summary = page.getByRole("region", { name: "Stash summary" });
    const one = (await summary.locator("div.num").first().textContent())!;
    expect(one).toMatch(/^\d[\d,]*p$/);

    await row.getByRole("spinbutton").fill("3");
    await expect(summary.locator("div.num").first()).not.toHaveText(one);
    await expect(summary).toContainText("3 items");
    const chat = page.getByRole("region", { name: "Trade-chat message" });
    await expect(chat.getByText(/^WTS \[Arcane Energize\] R5 \d+p$/)).toBeVisible();

    // Rank 0 is its own line with its own (much lower) price.
    await row.getByRole("combobox").selectOption("0|null");
    await expect(chat.getByText(/^WTS \[Arcane Energize\] R0 \d+p$/)).toBeVisible();

    await box.fill("wisp prime set");
    await box.press("Enter");
    await expect(page.getByRole("row", { name: /Wisp Prime Set/ })).toBeVisible();
    await expect(chat.getByText(/\[Wisp Prime Set\] \d+p/)).toBeVisible();
    expect((await axe(page)).violations).toEqual([]);
    expect(await fitsViewport(page)).toBe(true);

    await page.reload();
    await expect(page.getByRole("row", { name: /Arcane Energize/ }).getByRole("spinbutton")).toHaveValue("3");
    await page.goto("/");
    await expect(
      page.getByRole("region", { name: "My stash" }).getByRole("link", { name: "Open my stash" }),
    ).toBeVisible();
    await expect(page.getByRole("region", { name: "My stash" })).toContainText("for 4 items");

    await page.goto("/stash");
    await page.getByRole("button", { name: "Remove Wisp Prime Set from the stash" }).click();
    await page.getByRole("button", { name: "Empty the stash" }).click();
    await page.getByRole("button", { name: "Yes, empty it" }).click();
    await expect(page.getByRole("heading", { name: "Nothing in your stash yet" })).toBeVisible();
  });

  test("starts from a suggestion and ignores a corrupted stash", async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("seeded")) localStorage.setItem("wf-stash-v1", '{"not":"a list"');
      sessionStorage.setItem("seeded", "1");
    });
    await page.goto("/stash");
    await expect(page.getByRole("heading", { name: "Nothing in your stash yet" })).toBeVisible();
    const suggestion = page
      .getByRole("region", { name: "Add an item" })
      .getByRole("listitem")
      .first()
      .getByRole("button");
    const name = (await suggestion.textContent())!;
    await suggestion.click();
    await expect(page.getByRole("row", { name: new RegExp(name) })).toBeVisible();
    expect((await axe(page)).violations).toEqual([]);
  });
});

test.describe("ducats", () => {
  test("ranks prime parts by ducats per plat and builds a shopping list", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: "Ducats per plat" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Ducats for Baro" })).toBeVisible();
    const lists = page.getByRole("region", { name: "Prime parts by ducat value" });
    await expect(lists.getByRole("columnheader", { name: /Ducats per plat/ })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    await expect(lists.getByRole("row").nth(1)).toContainText("Prime");

    const plan = page.getByRole("region", { name: "Shopping list" });
    await expect(plan.getByText(/buys [\d,]+ ducats/)).toBeVisible();
    await expect(plan.getByText(/^WTB \[.+\] \d+p/).first()).toBeVisible();
    const before = await plan.getByRole("listitem").count();
    await page.getByLabel("Ducats you need").fill("100000");
    await expect(plan.getByText(/Capped at 20,000/)).toBeVisible();
    await expect(plan.getByText(/buys 2\d,\d{3} ducats/)).toBeVisible();
    expect(await plan.getByRole("listitem").count()).toBeGreaterThan(before);

    await lists.getByRole("tab", { name: "Sell, don't trade in" }).click();
    await expect(lists.getByRole("columnheader", { name: /Plat per 100 ducats/ })).toBeVisible();
    expect(await fitsViewport(page)).toBe(true);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/ducats");
    expect((await axe(page)).violations).toEqual([]);
  });
});

test.describe("set or parts", () => {
  test("compares each set with the sum of its parts", async ({ page }) => {
    await page.goto("/sets");
    await expect(page.getByRole("heading", { level: 1, name: "Set or parts?" })).toBeVisible();
    const list = page.getByRole("region", { name: "Biggest gaps first" });
    const first = list.getByRole("row").nth(1);
    await expect(first).toContainText("Prime Set");
    await expect(first).toContainText(/[+−]\d+p(set|parts) dearer/);
    expect(await fitsViewport(page)).toBe(true);
    const name = (await first.getByRole("link").locator("span > span").first().textContent())!;
    await first.getByRole("link").click();
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Set or parts" }).getByRole("row", { name: /All parts/ }),
    ).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/sets");
    expect((await axe(page)).violations).toEqual([]);
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
    await expect(details.getByRole("list", { name: "Arcanes to keep" }).getByRole("listitem").first()).toBeVisible();
    await expect(details.getByRole("row").nth(1).getByRole("cell", { name: "Sell", exact: true })).toBeVisible();

    // Sample: Arcane Reaper sells for 15p at rank 0, but R5 ÷ 21 copies ≈ 18p, so fusing pays; Energize does not.
    await page.getByLabel("Fuse to max rank when it pays").check();
    await expect(details.getByRole("row", { name: /Arcane Energize/ })).not.toContainText("Fuse");
    await ranking.getByRole("button", { name: /Duviri/ }).click();
    const duviri = page.getByRole("region", { name: "Duviri Arcane Collection" });
    await expect(duviri.getByRole("row", { name: /Arcane Reaper/ })).toContainText("Fuse → R5");
    await expect(duviri.getByRole("heading", { name: /^Sell or fuse these/ })).toBeVisible();
    await page.getByLabel("Fuse to max rank when it pays").uncheck();
    await ranking.getByRole("button", { name: /Eidolon/ }).click();

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
