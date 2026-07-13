import { expect, test, type Page } from "playwright/test";

const keys = {
  currency: "financial-calc-currency",
  language: "financial-calc-language",
  theme: "theme",
} as const;
const sidebarKey = "financial-calc-sidebar-collapsed";

function pressedButton(page: Page, text: string | RegExp) {
  return page.locator('button[aria-pressed="true"]').filter({ hasText: text });
}

async function dispatchStorage(page: Page, key: string, value: string) {
  await page.evaluate(
    ({ storageKey, storageValue }) => {
      localStorage.setItem(storageKey, storageValue);
      window.dispatchEvent(new StorageEvent("storage", { key: storageKey, newValue: storageValue }));
    },
    { storageKey: key, storageValue: value }
  );
}

test("repairs invalid preferences and follows valid and corrupted cross-tab updates", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript((storageKeys) => {
    localStorage.setItem(storageKeys.theme, "sepia");
    localStorage.setItem(storageKeys.language, "fr");
    localStorage.setItem(storageKeys.currency, "BTC");
  }, keys);
  await page.goto("/settings/");

  await expect(pressedButton(page, "System")).toHaveCount(1);
  await expect(pressedButton(page, "English")).toHaveCount(1);
  await expect(pressedButton(page, /USD/)).toHaveCount(1);
  await expect
    .poll(() =>
      page.evaluate((storageKeys) => storageKeys.map((key) => localStorage.getItem(key)), Object.values(keys))
    )
    .toEqual([null, null, null]);

  await dispatchStorage(page, keys.theme, "dark");
  await expect(pressedButton(page, "Dark")).toHaveCount(1);
  await expect(page.locator("html")).toHaveClass(/dark/);
  await dispatchStorage(page, keys.theme, "sepia");
  await expect(pressedButton(page, "System")).toHaveCount(1);
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), keys.theme)).toBeNull();

  await dispatchStorage(page, keys.language, "zh");
  await expect(pressedButton(page, "中文")).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  await dispatchStorage(page, keys.language, "fr");
  await expect(pressedButton(page, "English")).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), keys.language)).toBeNull();

  await dispatchStorage(page, keys.currency, "EUR");
  await expect(pressedButton(page, /EUR/)).toHaveCount(1);
  await dispatchStorage(page, keys.currency, "BTC");
  await expect(pressedButton(page, /USD/)).toHaveCount(1);
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), keys.currency)).toBeNull();
  expect(errors).toEqual([]);
});

test("reports blocked preference writes while keeping session changes active", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/settings/");
  await page.evaluate(
    ({ sidebarStorageKey, storageKeys }) => {
      const originalSetItem = Storage.prototype.setItem;
      const blockedKeys = new Set<string>([...Object.values(storageKeys), sidebarStorageKey]);
      Storage.prototype.setItem = function setItem(key: string, value: string) {
        if (blockedKeys.has(key)) {
          throw new DOMException("Storage blocked", "SecurityError");
        }
        return originalSetItem.call(this, key, value);
      };
    },
    { sidebarStorageKey: sidebarKey, storageKeys: keys }
  );

  const englishChangeError =
    "The change is active for this session but could not be saved. It may be lost after refresh.";
  const englishOperationError =
    "Browser storage is unavailable, so the operation could not be completed. Check the current state before trying again.";
  const chineseChangeError = "更改已在本次会话中生效，但无法保存；刷新后可能丢失。";
  const chineseOperationError = "浏览器存储不可用，操作未能完成。请确认当前状态后重试。";

  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(pressedButton(page, "Dark")).toHaveCount(1);
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByText(englishChangeError, { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: /CNY/ }).click();
  await expect(pressedButton(page, /USD/)).toHaveCount(1);
  await expect(page.getByText(englishOperationError, { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "中文", exact: true }).click();
  await expect(pressedButton(page, "中文")).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");

  const header = page.locator("header");
  await header.getByRole("button", { name: "切换主题: 深色" }).click();
  await page.getByRole("menuitemradio", { name: "浅色" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.getByText(chineseChangeError, { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: /CNY/ }).click();
  await expect(pressedButton(page, /USD/)).toHaveCount(1);
  await expect(page.getByText(chineseOperationError, { exact: true }).first()).toBeVisible();

  await header.getByRole("button", { name: "切换为英文" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await expect(page.locator('aside[data-collapsed="true"]')).toBeAttached();
  await expect
    .poll(() =>
      page.evaluate(
        (storageKeys) => storageKeys.map((key) => localStorage.getItem(key)),
        [...Object.values(keys), sidebarKey]
      )
    )
    .toEqual([null, null, null, null]);
  expect(errors).toEqual([]);
});
