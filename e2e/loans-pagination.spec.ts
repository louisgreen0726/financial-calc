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

test("bounds the live amortization table while preserving complete exports", async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await page.addInitScript(() => {
    const probeWindow = window as typeof window & { __printedLoanRows?: number };
    window.print = () => {
      probeWindow.__printedLoanRows = document.querySelectorAll("#loan-schedule-table tbody tr").length;
      window.dispatchEvent(new Event("afterprint"));
    };
  });
  await page.goto("/loans/");

  const amountInput = page.locator("#loan-amount");
  expect(await amountInput.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(true);

  const rows = page.locator("#loan-schedule-table tbody tr");
  const firstPeriod = () => rows.first().getByRole("rowheader");
  await expect(rows).toHaveCount(100);
  await expect(page.getByText("Page 1 / 4", { exact: true })).toBeVisible();
  await expect(firstPeriod()).toHaveText("1");

  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 2 / 4", { exact: true })).toBeVisible();
  await expect(firstPeriod()).toHaveText("101");

  await page.getByRole("button", { name: "Next page" }).click();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 4 / 4", { exact: true })).toBeVisible();
  await expect(rows).toHaveCount(60);
  await expect(firstPeriod()).toHaveText("301");
  await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();

  await page.locator("#loan-term").fill("50");
  await expect(page.getByText("Page 1 / 6", { exact: true })).toBeVisible();
  await expect(rows).toHaveCount(100);
  await expect(firstPeriod()).toHaveText("1");

  await page.getByRole("button", { name: "Export" }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("menuitem", { name: "Export CSV" }).click(),
  ]);
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const csv = await readFile(downloadPath!, "utf8");
  expect(csv.trim().split(/\r?\n/)).toHaveLength(601);

  await page.getByRole("button", { name: "Export" }).click();
  await page.getByRole("menuitem", { name: "Print / Save as PDF" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as typeof window & { __printedLoanRows?: number }).__printedLoanRows ?? null)
    )
    .toBe(600);
  await expect(rows).toHaveCount(100);
  await expect(page.getByText("Page 1 / 6", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
