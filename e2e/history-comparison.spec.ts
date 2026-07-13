import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "playwright/test";

test("compares two compatible recorded results without implying recalculation", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem(
      "financial-calc-history",
      JSON.stringify({
        version: 1,
        items: [
          {
            id: "capm-baseline",
            page: "equity",
            inputs: { rf: "3.5", beta: "1.2", rm: "10" },
            result: 0.08,
            timestamp: Date.now() - 3_000,
            label: "CAPM",
            resultFormat: "percentDecimal",
          },
          {
            id: "capm-comparison",
            page: "equity",
            inputs: { rf: "4", beta: "1.3", rm: "11" },
            result: 0.105,
            timestamp: Date.now() - 2_000,
            label: "资本资产定价",
            resultFormat: "percentDecimal",
          },
          {
            id: "wacc",
            page: "equity",
            inputs: { equity: "1000", debt: "500", costEquity: "12", costDebt: "6", taxRate: "25" },
            result: 0.09,
            timestamp: Date.now() - 1_000,
            label: "WACC",
            resultFormat: "percentDecimal",
          },
          {
            id: "currency",
            page: "tvm",
            inputs: { rate: "5", nper: "10", pmt: "0", pv: "", fv: "1500", type: "0", target: "pv" },
            result: 1000,
            timestamp: Date.now(),
            label: "PV",
            resultFormat: "currency",
          },
        ],
      })
    );
  });

  await page.goto("/history/");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.finCalcHydrated)).toBe("true");
  await page.getByRole("button", { name: "Compare", exact: true }).click();

  const baselineRow = page.locator('[data-history-id="capm-baseline"]');
  const comparisonRow = page.locator('[data-history-id="capm-comparison"]');
  const waccRow = page.locator('[data-history-id="wacc"]');
  const currencyRow = page.locator('[data-history-id="currency"]');
  await baselineRow.getByRole("button", { name: "Select for comparison" }).click();
  await expect(waccRow.getByRole("button", { name: "Select for comparison" })).toHaveAttribute(
    "title",
    "Choose another record for the same metric."
  );
  await expect(currencyRow.getByRole("button", { name: "Select for comparison" })).toHaveAttribute(
    "title",
    "The original currency was not recorded for this result."
  );

  await comparisonRow.getByRole("button", { name: "Select for comparison" }).click();
  await page.getByRole("button", { name: "Compare selected" }).click();

  const dialog = page.getByRole("dialog", {
    name: "Compare recorded results: CAPM",
  });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(
    "This compares the outputs saved at the time. It does not recalculate them with the current model."
  );
  await expect(dialog).toContainText("+2.5 percentage points");
  await expect(dialog.getByRole("row", { name: /Risk-Free Rate.*3\.5.*4/ })).toBeVisible();

  const baseline = dialog.getByRole("region", { name: "Baseline" });
  const comparison = dialog.getByRole("region", { name: "Comparison" });
  const baselineTimestamp = await baseline.locator("p").last().textContent();
  const comparisonTimestamp = await comparison.locator("p").last().textContent();
  await expect(baseline).toContainText("8%");
  await expect(comparison).toContainText("10.5%");

  const swap = dialog.getByRole("button", { name: "Swap baseline and comparison" });
  await expect(swap).toHaveAttribute("title", "Swap baseline and comparison");
  await swap.click();

  await expect(dialog).toBeVisible();
  await expect(baseline).toContainText("10.5%");
  await expect(baseline.locator("p").last()).toHaveText(comparisonTimestamp ?? "");
  await expect(comparison).toContainText("8%");
  await expect(comparison.locator("p").last()).toHaveText(baselineTimestamp ?? "");
  await expect(dialog).toContainText("-2.5 percentage points");
  await expect(dialog.getByRole("row", { name: /Risk-Free Rate.*4.*3\.5/ })).toBeVisible();

  await dialog.getByRole("button", { name: "Close" }).last().click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "Switch to Chinese" }).click();
  await page.getByRole("button", { name: "比较所选记录" }).click();

  const chineseDialog = page.getByRole("dialog", { name: /比较已记录结果/ });
  await expect(chineseDialog.getByRole("button", { name: "交换基准与对比记录" })).toBeVisible();
  await chineseDialog.getByRole("button", { name: "交换基准与对比记录" }).click();
  await expect(chineseDialog).toContainText("+2.5 个百分点");

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa", "best-practice"])
    .analyze();
  expect(violations).toEqual([]);
  expect(errors).toEqual([]);
});
