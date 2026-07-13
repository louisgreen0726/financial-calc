import { expect, test } from "playwright/test";

const pendingRestoreKey = "financial-calc-pending-restore";

test("applies an uncleared pending restore only once", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript((storageKey) => {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({ page: "tvm", inputs: { rate: "7", nper: "20" }, timestamp: Date.now() })
    );
    const originalRemoveItem = Storage.prototype.removeItem;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.removeItem = function removeItem(key: string) {
      if (this === window.sessionStorage && key === storageKey) {
        throw new DOMException("Storage blocked", "SecurityError");
      }
      return originalRemoveItem.call(this, key);
    };
    Storage.prototype.setItem = function setItem(key: string, value: string) {
      if (this === window.sessionStorage && key === storageKey) {
        throw new DOMException("Storage blocked", "SecurityError");
      }
      return originalSetItem.call(this, key, value);
    };
  }, pendingRestoreKey);

  await page.goto("/tvm/");

  const cleanupError =
    "The calculation was restored, but temporary restore data could not be cleared. Refreshing may restore it again.";
  await expect(page.locator("#tvm-rate")).toHaveValue("7");
  await expect(page.locator("#tvm-nper")).toHaveValue("20");
  await expect(page.getByText(cleanupError, { exact: true })).toHaveCount(1);

  await page.locator("#tvm-rate").fill("8");

  await expect.poll(() => new URL(page.url()).searchParams.get("tvm_rate")).toBe("8");
  await expect(page.locator("#tvm-rate")).toHaveValue("8");
  await expect(page.locator("#tvm-nper")).toHaveValue("20");
  await expect(page.getByText(cleanupError, { exact: true })).toHaveCount(1);
  expect(errors).toEqual([]);
});
