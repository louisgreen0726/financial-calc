import { expect, test, type Page } from "playwright/test";

const storageKeys = {
  currency: "financial-calc-currency",
  favorites: "financial-calc-favorites",
  history: "financial-calc-history",
  language: "financial-calc-language",
  sidebar: "financial-calc-sidebar-collapsed",
  theme: "theme",
} as const;

function collectPageErrors(page: Page, errors: string[]) {
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
}

function pressedButton(page: Page, text: string | RegExp) {
  return page.locator('button[aria-pressed="true"]').filter({ hasText: text });
}

test("a clear from another tab resets live history and preferences", async ({ context, page }) => {
  const errors: string[] = [];
  collectPageErrors(page, errors);
  await page.goto("/");
  await page.evaluate(
    ({ keys, timestamp }) => {
      localStorage.setItem(
        keys.history,
        JSON.stringify({
          version: 1,
          items: [
            {
              id: "cross-tab-record",
              page: "tvm",
              inputs: { rate: "5" },
              result: 100,
              timestamp,
              label: "Cross-tab clear sentinel",
              resultFormat: "currency",
            },
          ],
        })
      );
      localStorage.setItem(keys.favorites, JSON.stringify(["cross-tab-record"]));
      localStorage.setItem(keys.theme, "dark");
      localStorage.setItem(keys.language, "zh");
      localStorage.setItem(keys.currency, "EUR");
      localStorage.setItem(keys.sidebar, "true");
    },
    { keys: storageKeys, timestamp: Date.now() }
  );

  await page.goto("/history/");
  await expect(page.getByText("Cross-tab clear sentinel", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^(Favorites|收藏)$/ })).toHaveAttribute("aria-pressed", "true");

  const settingsPage = await context.newPage();
  collectPageErrors(settingsPage, errors);
  await settingsPage.goto("/settings/");
  await expect(pressedButton(settingsPage, /^(Dark|深色)$/)).toHaveCount(1);
  await expect(pressedButton(settingsPage, "中文")).toHaveCount(1);
  await expect(pressedButton(settingsPage, /EUR/)).toHaveCount(1);
  await expect(settingsPage.locator('aside[data-collapsed="true"]')).toBeAttached();

  const clearingPage = await context.newPage();
  collectPageErrors(clearingPage, errors);
  await clearingPage.goto("/");
  await clearingPage.evaluate(() => localStorage.clear());

  await expect(page.getByText("Cross-tab clear sentinel", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /^(No history yet|暂无历史记录)$/ })).toBeVisible();
  await expect(pressedButton(settingsPage, /^(System|跟随系统)$/)).toHaveCount(1);
  await expect(pressedButton(settingsPage, "English")).toHaveCount(1);
  await expect(pressedButton(settingsPage, /USD/)).toHaveCount(1);
  await expect(settingsPage.locator('aside[data-collapsed="false"]')).toBeAttached();
  await expect
    .poll(() =>
      settingsPage.evaluate((keys) => {
        const serializedHistory = localStorage.getItem(keys.history);
        const storedHistory = serializedHistory === null ? null : (JSON.parse(serializedHistory) as unknown);
        const historyItems =
          storedHistory !== null &&
          typeof storedHistory === "object" &&
          "items" in storedHistory &&
          Array.isArray(storedHistory.items)
            ? storedHistory.items
            : [];
        return {
          historyCount: historyItems.length,
          remainingValues: [keys.currency, keys.favorites, keys.language, keys.sidebar, keys.theme].map((key) =>
            localStorage.getItem(key)
          ),
        };
      }, storageKeys)
    )
    .toEqual({ historyCount: 0, remainingValues: [null, null, null, null, null] });
  expect(errors).toEqual([]);
});
