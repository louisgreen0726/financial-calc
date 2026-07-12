import { expect, test } from "playwright/test";

test("renders the one-day 99% normal VaR and expected-shortfall reference", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/risk/");
  await page.locator("#risk-value").fill("100000");
  await page.locator("#risk-volatility").fill("20");
  await page.locator("#risk-days").fill("1");
  await page.locator("#risk-confidence").click();
  await page.getByRole("option", { name: "99%" }).click();

  await expect(page.getByText("$2,930.92", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("$3,357.85", { exact: true })).toBeVisible();
  await expect(page.getByText(/2\.93% % of portfolio/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Deterministic Stress Scenarios" })).toBeVisible();
  await expect(page.getByText(/no assigned probability.*not forecasts/i)).toBeVisible();

  const extremeScenario = page.getByRole("row", { name: /Extreme decline/ });
  await expect(extremeScenario).toContainText("-20.00%");
  await expect(extremeScenario).toContainText("$20,000.00");
  await expect(extremeScenario).toContainText("$80,000.00");
  await expect(extremeScenario).toContainText("6.82x");
  expect(errors).toEqual([]);
});

test.describe("mobile stress scenarios", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps wide scenario data inside a local scroller", async ({ page }) => {
    await page.goto("/risk/");
    await expect(page.getByRole("heading", { name: "Deterministic Stress Scenarios" })).toBeVisible();

    const geometry = await page.evaluate(() => {
      const table = document.querySelector('[aria-label="Deterministic Stress Scenarios"]');
      const container = table?.parentElement;
      return {
        documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
        localOverflow: container ? container.scrollWidth - container.clientWidth : 0,
      };
    });

    expect(geometry.documentOverflow).toBeLessThanOrEqual(1);
    expect(geometry.localOverflow).toBeGreaterThan(0);
  });
});
