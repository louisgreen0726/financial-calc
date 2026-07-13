import { expect, test } from "playwright/test";

test("localizes default Portfolio assets without overwriting custom names", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/portfolio/");
  const firstAsset = page.locator("#portfolio-desktop-asset-name-1");
  const secondAsset = page.locator("#portfolio-desktop-asset-name-2");
  await expect(firstAsset).toHaveValue("US Tech");
  await expect(secondAsset).toHaveValue("Bonds");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.finCalcHydrated)).toBe("true");

  await page.getByRole("button", { name: "Switch to Chinese" }).click();
  await expect(firstAsset).toHaveValue("美国科技股");
  await expect(secondAsset).toHaveValue("债券");

  await firstAsset.fill("我的长期配置");
  await page.getByRole("button", { name: "切换为英文" }).click();
  await expect(firstAsset).toHaveValue("我的长期配置");
  await expect(secondAsset).toHaveValue("Bonds");

  await page.getByRole("button", { name: "Reset defaults" }).click();
  await expect(firstAsset).toHaveValue("US Tech");
  await expect(secondAsset).toHaveValue("Bonds");
  expect(errors).toEqual([]);
});
