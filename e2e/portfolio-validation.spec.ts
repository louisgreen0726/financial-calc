import { expect, test, type Page } from "playwright/test";

function collectBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  return errors;
}

test("restores supported negative risk-free rates and rejects out-of-range portfolio settings", async ({ page }) => {
  const errors = collectBrowserErrors(page);

  await page.goto("/portfolio/?portfolio_rf=-2&portfolio_correlation=-0.25");
  const riskFreeRate = page.getByRole("slider", { name: /Risk-Free Rate \(%\): -2%/ });
  const correlation = page.getByRole("slider", { name: /Correlation: -0.25/ });
  await expect(riskFreeRate).toHaveAttribute("aria-valuemin", "-10");
  await expect(riskFreeRate).toHaveAttribute("aria-valuemax", "10");
  await expect(riskFreeRate).toHaveAttribute("aria-valuenow", "-2");
  await expect(correlation).toHaveAttribute("aria-valuenow", "-0.25");

  await page.goto("/portfolio/?portfolio_rf=50&portfolio_correlation=5");
  await expect(page.getByRole("slider", { name: /Risk-Free Rate \(%\): 3%/ })).toHaveAttribute("aria-valuenow", "3");
  await expect(page.getByRole("slider", { name: /Correlation: 0.2/ })).toHaveAttribute("aria-valuenow", "0.2");
  expect(errors).toEqual([]);
});
