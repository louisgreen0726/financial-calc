import { expect, test } from "playwright/test";

test("keeps consecutive TVM field edits in inputs and URL state", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tvm/");

  await page.locator("#tvm-rate").fill("8");
  await page.locator("#tvm-nper").fill("24");

  await expect(page.locator("#tvm-rate")).toHaveValue("8");
  await expect(page.locator("#tvm-nper")).toHaveValue("24");
  await expect
    .poll(() => {
      const params = new URL(page.url()).searchParams;
      return { rate: params.get("tvm_rate"), nper: params.get("tvm_nper") };
    })
    .toEqual({ rate: "8", nper: "24" });
  expect(errors).toEqual([]);
});
