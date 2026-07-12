import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "playwright/test";

function collectBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  return errors;
}

test("prices, restores, shares, and localizes continuous dividend yield", async ({ page }) => {
  const errors = collectBrowserErrors(page);

  await page.goto("/options/");
  await expect(page.locator("#opt-dividend-yield")).toHaveValue("0");
  await expect(page.getByText("$10.45", { exact: true })).toBeVisible();

  await page.goto("/options/?options_dividendYield=2");
  await expect(page.locator("#opt-dividend-yield")).toHaveValue("2");
  await expect(page.getByText("$9.23", { exact: true })).toBeVisible();
  await expect(page.getByText("$6.33", { exact: true })).toBeVisible();
  await page.locator("#opt-market-price").fill("9.227");
  await expect(page.locator("[data-implied-volatility-result]")).toHaveText("20.00%");

  await page.getByRole("button", { name: "Export" }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("menuitem", { name: "Export JSON" }).click(),
  ]);
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const report = JSON.parse(await readFile(downloadPath!, "utf8"));
  expect(report).toMatchObject({
    schemaVersion: 2,
    report: {
      inputs: {
        "Risk-Free Rate (%)": "5",
        "Time to Maturity (Years)": "1",
        "Option Type": "Call Option",
      },
      rawInputs: { rate: "5", time: "1", impliedOptionType: "call" },
      results: { "Implied Volatility": "20.00%" },
    },
  });
  expect(report.data.impliedVolatility).toBeCloseTo(0.2, 4);

  await page.getByRole("button", { name: "Share Results" }).click();
  await page.getByRole("button", { name: "Copy shareable link" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("options_dividendYield=2");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("options_marketPrice=9.227");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Switch to Chinese" }).click();
  await expect(page.locator('label[for="opt-dividend-yield"]')).toHaveText("连续股息收益率 (%)");
  expect(errors).toEqual([]);
});

test.describe("mobile options workflow", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps all inputs and results clear of fixed navigation", async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto("/options/?options_dividendYield=2");
    await expect(page.locator("#opt-dividend-yield")).toHaveValue("2");

    const layout = await page.evaluate(() => ({
      inputCount: document.querySelectorAll("#options-report-content input").length,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(layout).toEqual({ inputCount: 7, scrollWidth: 390, clientWidth: 390 });

    await page.locator("[data-result-status]").evaluate((element) => element.scrollIntoView({ block: "nearest" }));
    const resultNavigationOverlap = await page.evaluate(() => {
      const result = document.querySelector("[data-result-status]")?.getBoundingClientRect();
      const navigation = document.querySelector(".mobile-nav-bar")?.getBoundingClientRect();
      if (!result || !navigation) return null;
      const width = Math.max(0, Math.min(result.right, navigation.right) - Math.max(result.left, navigation.left));
      const height = Math.max(0, Math.min(result.bottom, navigation.bottom) - Math.max(result.top, navigation.top));
      return width * height;
    });

    expect(resultNavigationOverlap).toBe(0);
    expect(errors).toEqual([]);
  });
});
