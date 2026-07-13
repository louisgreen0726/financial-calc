import { readFile } from "node:fs/promises";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "playwright/test";

test("downloads and restores history, favorites, and workspace preferences", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    if (sessionStorage.getItem("workspace-backup-seeded") === "true") return;
    sessionStorage.setItem("workspace-backup-seeded", "true");
    const item = {
      id: "workspace-roundtrip",
      page: "loans",
      inputs: { principal: "250000", annualRate: "4.5", years: "20" },
      result: 1581.62,
      timestamp: Date.now(),
      label: "Monthly payment",
      resultFormat: "currency",
    };
    localStorage.setItem("financial-calc-history", JSON.stringify({ version: 1, items: [item] }));
    localStorage.setItem("financial-calc-favorites", JSON.stringify([item.id, "orphan"]));
    localStorage.setItem("financial-calc-language", "zh");
    localStorage.setItem("theme", "dark");
    localStorage.setItem("financial-calc-currency", "EUR");
    localStorage.setItem("financial-calc-sidebar-collapsed", "true");
    localStorage.setItem("financial-calc-history-clear-generation", "7");
    localStorage.setItem("financial-calc-pending-restore", JSON.stringify({ page: "tvm" }));
    localStorage.setItem("financial-calc-settings", JSON.stringify({ unused: true }));
    localStorage.setItem("financial-calc-drafts", JSON.stringify({ unused: true }));
  });

  await page.goto("/settings/");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.finCalcHydrated)).toBe("true");
  await expect(page.getByRole("button", { name: "导出工作区 (JSON)" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出工作区 (JSON)" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("financial-calc-workspace.json");
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const backupText = await readFile(downloadPath!, "utf8");
  const backup = JSON.parse(backupText) as {
    kind: string;
    version: number;
    history: { version: number; items: Array<{ id: string }> };
    favorites: string[];
    preferences: { language: string; theme: string; currency: string; sidebarCollapsed: boolean };
  };
  expect(backup).toMatchObject({
    kind: "financial-calc-workspace",
    version: 1,
    history: { version: 1, items: [{ id: "workspace-roundtrip" }] },
    favorites: ["workspace-roundtrip"],
    preferences: { language: "zh", theme: "dark", currency: "EUR", sidebarCollapsed: true },
  });
  expect(backupText).not.toContain("clear-generation");
  expect(backupText).not.toContain("pending-restore");
  expect(backupText).not.toContain("financial-calc-settings");
  expect(backupText).not.toContain("financial-calc-drafts");

  await page.evaluate(() => {
    localStorage.setItem("financial-calc-history", JSON.stringify({ version: 1, items: [] }));
    localStorage.setItem("financial-calc-favorites", "[]");
    localStorage.setItem("financial-calc-language", "en");
    localStorage.setItem("theme", "light");
    localStorage.setItem("financial-calc-currency", "USD");
    localStorage.setItem("financial-calc-sidebar-collapsed", "false");
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe("en");

  await page.getByLabel("Choose a workspace backup JSON file").setInputFiles({
    name: "financial-calc-workspace.json",
    mimeType: "application/json",
    buffer: Buffer.from(backupText),
  });
  const preview = page.getByRole("dialog", { name: "Review workspace restore" });
  await expect(preview).toContainText("1 new");
  await expect(preview).toContainText("1 favorites added");
  await expect(preview).toContainText(
    "Language, theme, currency, and sidebar preferences will replace current choices."
  );

  const previewAudit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa", "best-practice"])
    .analyze();
  expect(previewAudit.violations).toEqual([]);
  await preview.getByRole("button", { name: "Restore workspace" }).click();

  await expect
    .poll(() =>
      page.evaluate(() => ({
        history: JSON.parse(localStorage.getItem("financial-calc-history") ?? "null"),
        favorites: JSON.parse(localStorage.getItem("financial-calc-favorites") ?? "[]"),
        language: localStorage.getItem("financial-calc-language"),
        theme: localStorage.getItem("theme"),
        currency: localStorage.getItem("financial-calc-currency"),
        sidebarCollapsed: localStorage.getItem("financial-calc-sidebar-collapsed"),
      }))
    )
    .toMatchObject({
      history: { version: 1, items: [{ id: "workspace-roundtrip" }] },
      favorites: ["workspace-roundtrip"],
      language: "zh",
      theme: "dark",
      currency: "EUR",
      sidebarCollapsed: "true",
    });
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("aside[data-collapsed='true']")).toBeVisible();
  await expect(page.getByRole("button", { name: "深色", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "EUR 欧元", exact: true })).toHaveAttribute("aria-pressed", "true");

  const restoredAudit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa", "best-practice"])
    .analyze();
  expect(restoredAudit.violations).toEqual([]);
  expect(errors).toEqual([]);
});
