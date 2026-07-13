import { expect, test, type Page } from "playwright/test";

const keys = {
  currency: "financial-calc-currency",
  language: "financial-calc-language",
  theme: "theme",
} as const;

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
