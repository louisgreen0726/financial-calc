import { expect, test } from "playwright/test";

test("bounds shared-array URL restoration and rejects malformed JSON-prefixed values", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/cash-flow/?cash_flows=json%3A%7B%7D");
  await expect(page.locator('input[type="number"]')).toHaveCount(6);

  const oversizedArray = Array.from({ length: 170 }, (_, index) => String(index));
  const encoded = encodeURIComponent(`json:${JSON.stringify(oversizedArray)}`);
  await page.goto(`/cash-flow/?cash_flows=${encoded}`);
  await expect(page.locator('input[type="number"]')).toHaveCount(121);
  await expect(page.getByRole("button", { name: "Add Period" })).toBeDisabled();
  expect(errors).toEqual([]);
});
