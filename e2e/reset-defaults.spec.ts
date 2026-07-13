import { expect, test } from "playwright/test";

const calculators = [
  { route: "/tvm/", prefix: "tvm", query: "tvm_rate=9", selector: "#tvm-rate", restored: "9", fallback: "5" },
  {
    route: "/cash-flow/",
    prefix: "cash",
    query: "cash_rate=9",
    selector: "#cash-flow-discount-rate",
    restored: "9",
    fallback: "10",
  },
  {
    route: "/equity/",
    prefix: "equity",
    query: "equity_rf=9",
    selector: "#capm-rf",
    restored: "9",
    fallback: "3.5",
  },
  {
    route: "/portfolio/",
    prefix: "portfolio",
    query: "portfolio_seed=custom-seed",
    selector: "#portfolio-seed",
    restored: "custom-seed",
    fallback: "balanced-2026",
  },
  {
    route: "/bonds/",
    prefix: "bonds",
    query: "bonds_faceValue=2000",
    selector: "#bond-face",
    restored: "2000",
    fallback: "1000",
  },
  {
    route: "/options/",
    prefix: "options",
    query: "options_spot=123",
    selector: "#opt-spot",
    restored: "123",
    fallback: "100",
  },
  {
    route: "/risk/",
    prefix: "risk",
    query: "risk_value=250000",
    selector: "#risk-value",
    restored: "250000",
    fallback: "100000",
  },
  {
    route: "/loans/",
    prefix: "loans",
    query: "loans_amount=250000",
    selector: "#loan-amount",
    restored: "250000",
    fallback: "500000",
  },
  {
    route: "/macro/",
    prefix: "macro",
    query: "macro_startPrice=250",
    selector: "#macro-inflation-start",
    restored: "250",
    fallback: "100",
  },
] as const;

for (const calculator of calculators) {
  test(`${calculator.route} resets defaults and restores the prior state`, async ({ page }) => {
    const calculatorParam = calculator.query.slice(0, calculator.query.indexOf("="));
    await page.goto(`${calculator.route}?${calculator.query}&utm_source=reset-test`);
    const input = page.locator(calculator.selector);
    await expect(input).toHaveValue(calculator.restored);

    await page.getByRole("button", { name: "Reset defaults" }).click();
    await expect(input).toHaveValue(calculator.fallback);
    await expect.poll(() => new URL(page.url()).searchParams.get("utm_source")).toBe("reset-test");
    await expect
      .poll(() => [...new URL(page.url()).searchParams.keys()].some((key) => key.startsWith(`${calculator.prefix}_`)))
      .toBe(false);

    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(input).toHaveValue(calculator.restored);
    await expect.poll(() => new URL(page.url()).searchParams.get(calculatorParam)).toBe(calculator.restored);
  });
}
