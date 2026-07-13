import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "playwright/test";

const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa", "best-practice"];

test("finds a calculator from the global header and follows its route", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Search calculators" }).click();
  const dialog = page.getByRole("dialog", { name: "Search calculators" });
  const search = dialog.getByRole("searchbox", { name: "Search calculators" });
  await expect(search).toBeFocused();

  await search.fill("wacc valuation");
  const resultLinks = dialog.getByRole("link");
  await expect(resultLinks).toHaveCount(1);
  const stockValuation = dialog.getByRole("link", { name: /Stock Valuation/ });
  await expect(stockValuation).toContainText("DDM, CAPM, and WACC models");

  await stockValuation.click();
  await expect(page).toHaveURL(/\/equity\/?$/);
  await expect(dialog).toHaveCount(0);
});

test.describe("narrow viewport", () => {
  test.use({ viewport: { width: 320, height: 720 } });

  test("keeps the header and calculator finder within the viewport", async ({ page }) => {
    await page.goto("/");

    const header = page.locator("header");
    await expect(header).toBeVisible();
    const headerOverflow = await header.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(headerOverflow.scrollWidth).toBeLessThanOrEqual(headerOverflow.clientWidth);

    await header.getByRole("button", { name: "Search calculators" }).click();
    const dialog = page.getByRole("dialog", { name: "Search calculators" });
    const search = dialog.getByRole("searchbox", { name: "Search calculators" });
    await expect(search).toBeFocused();

    const dialogOverflow = await dialog.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        clientWidth: element.clientWidth,
        left: bounds.left,
        right: bounds.right,
        scrollWidth: element.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    });
    expect(dialogOverflow.scrollWidth).toBeLessThanOrEqual(dialogOverflow.clientWidth);
    expect(dialogOverflow.left).toBeGreaterThanOrEqual(0);
    expect(dialogOverflow.right).toBeLessThanOrEqual(dialogOverflow.viewportWidth);

    const { violations } = await new AxeBuilder({ page }).include("[role='dialog']").withTags(axeTags).analyze();
    expect(violations).toEqual([]);
  });
});
