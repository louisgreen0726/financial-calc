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
  expect(errors).toEqual([]);
});
