import { expect, test } from "playwright/test";

test("recovers from denied share, clipboard, download, and print operations", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    const testWindow = window as typeof window & {
      __legacyCopyAllowed: boolean;
      __shareErrorName: "AbortError" | "NotAllowedError";
    };
    testWindow.__legacyCopyAllowed = false;
    testWindow.__shareErrorName = "AbortError";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () => Promise.reject(new DOMException("Permission denied", "NotAllowedError")),
      },
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: () => Promise.reject(new DOMException("Share unavailable", testWindow.__shareErrorName)),
    });
    document.execCommand = () => testWindow.__legacyCopyAllowed;
  });
  await page.goto("/loans/");

  await page.getByRole("button", { name: "Share Results" }).click();
  const dialog = page.getByRole("dialog", { name: "Share Results" });
  await dialog.getByRole("button", { name: "Share Results" }).click();
  await expect(page.getByText("Unable to share. Try copying the link or text instead.")).toHaveCount(0);

  await page.evaluate(() => {
    (window as typeof window & { __shareErrorName: string }).__shareErrorName = "NotAllowedError";
  });
  await dialog.getByRole("button", { name: "Share Results" }).click();
  await expect(page.getByText("Unable to share. Try copying the link or text instead.")).toBeVisible();

  await dialog.getByRole("button", { name: "Copy as plain text" }).click();
  await expect(page.getByText("Failed to copy")).toBeVisible();
  await page.evaluate(() => {
    (window as typeof window & { __legacyCopyAllowed: boolean }).__legacyCopyAllowed = true;
  });
  await dialog.getByRole("button", { name: "Copy as Markdown table" }).click();
  await expect(page.getByText("Copied to clipboard")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await page.evaluate(() => {
    URL.createObjectURL = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.getByRole("button", { name: "Export" }).click();
    await page.getByRole("menuitem", { name: "Export CSV" }).click();
    await expect(page.getByText("Failed to export CSV").last()).toBeVisible();
    await expect(page.getByRole("button", { name: "Export" })).toBeEnabled();
  }

  await page.evaluate(() => {
    const getElementById = document.getElementById.bind(document);
    document.getElementById = (id) => (id === "loans-report-content" ? null : getElementById(id));
  });
  await page.getByRole("button", { name: "Export" }).click();
  await page.getByRole("menuitem", { name: "Print / Save as PDF" }).click();
  await expect(page.getByText("Failed to open the print dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Export" })).toBeEnabled();
  expect(pageErrors).toEqual([]);
});
