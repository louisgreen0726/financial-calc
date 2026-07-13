import { expect, test, type Page } from "playwright/test";

function collectBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  return errors;
}

test("explains bond coupon-period constraints and recovers at the calculation boundary", async ({ page }) => {
  const errors = collectBrowserErrors(page);

  await page.goto("/bonds/");
  const years = page.locator("#bond-years");
  const yearsError = page.locator("#bond-years-error");

  await years.fill("10.25");
  await years.blur();
  await expect(years).toHaveAttribute("aria-invalid", "true");
  await expect(years).toHaveAttribute("aria-describedby", /\bbond-years-error\b/);
  await expect(yearsError).toHaveText(
    "Years to maturity must produce a whole number of coupon periods at the selected payment frequency."
  );

  await page.getByRole("combobox", { name: "Payment Frequency" }).click();
  await page.getByRole("option", { name: "Monthly", exact: true }).click();
  await years.fill("50.5");
  await years.blur();
  await expect(yearsError).toHaveText(
    "The selected term and payment frequency exceed the 600-period calculation limit."
  );

  await years.fill("50");
  await years.blur();
  await expect(years).toHaveAttribute("aria-invalid", "false");
  await expect(yearsError).toBeHidden();
  await expect(page.getByRole("status")).toContainText("Fair Price");
  expect(errors).toEqual([]);
});
